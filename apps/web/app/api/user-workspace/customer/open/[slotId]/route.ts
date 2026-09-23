import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { assertFreshUsageController, customerProvisioningGate, verifiedCustomerTemplateId } from '@/lib/coder/customer-provisioning.server';
import { coderApiConfig, coderApiRequest, coderServiceClient, getCoderSlot } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slotId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

type CustomerIdentity = {
  id?: string; username?: string; email?: string; login_type?: string;
  status?: string; is_service_account?: boolean;
};
type CustomerWorkspace = {
  id?: string; owner_id?: string; name?: string; template_id?: string;
  status?: string;
  latest_build?: { status?: string; transition?: string; template_version_id?: string };
};

function publicCoderOrigin(): string {
  const configured = process.env.CODER_ACCESS_URL;
  if (!configured) throw new CostGateError('The customer Coder address is not configured.');
  let url: URL;
  try { url = new URL(configured); }
  catch { throw new CostGateError('The customer Coder address is invalid.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new CostGateError('The customer Coder address must be a clean HTTPS origin.');
  }
  return url.origin;
}

function customerWorkspaceState(workspace: CustomerWorkspace): 'running' | 'stopped' | 'transitioning' | 'unknown' {
  if (workspace.status === 'running' || workspace.status === 'stopped') return workspace.status;
  if (['starting', 'pending', 'stopping', 'canceling'].includes(workspace.status || '')) return 'transitioning';
  const build = workspace.latest_build;
  if (build?.status === 'succeeded' && build.transition === 'start') return 'running';
  if (build?.status === 'succeeded' && build.transition === 'stop') return 'stopped';
  if (['pending', 'running', 'starting', 'stopping', 'canceling'].includes(build?.status || '') &&
      ['start', 'stop'].includes(build?.transition || '')) return 'transitioning';
  return 'unknown';
}

/** Read-only handoff to Coder's own OIDC-authenticated workspace page.
 * Never use the operator's identity, send its token to a browser, start a
 * stopped workspace, or invent a code-server URL outside Coder's access checks.
 */
export async function GET(request: Request, { params }: Context) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  const { slotId } = await params;
  if (!UUID.test(slotId)) return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: noStore });

  try {
    customerProvisioningGate();
    const templateId = await verifiedCustomerTemplateId();
    const pinnedVersionId = process.env.CODER_CUSTOMER_TEMPLATE_VERSION_ID;
    if (!pinnedVersionId || !UUID.test(pinnedVersionId)) {
      throw new CostGateError('Approved customer template version is not configured.');
    }
    await assertFreshUsageController();
    const slot = await getCoderSlot(user.id, slotId);
    if (!slot) return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: noStore });
    if (slot.state !== 'provisioned' || !slot.workspace_id || !UUID.test(slot.workspace_id)) {
      return NextResponse.json({ error: 'Your workspace is not ready. No new workspace was created.' }, { status: 409, headers: noStore });
    }
    if (slot.coder_api_origin !== coderApiConfig().url) {
      throw new CostGateError('Workspace belongs to a different Coder deployment. Contact support.');
    }

    const db = coderServiceClient();
    const [identityResult, jobResult] = await Promise.all([
      db.from('coder_customer_identities').select('coder_user_id,verified_email').eq('user_id', user.id).maybeSingle(),
      db.from('coder_customer_jobs').select('coder_user_id,template_id,status')
        .eq('slot_id', slotId).eq('user_id', user.id).maybeSingle(),
    ]);
    const identity = identityResult.data;
    const job = jobResult.data;
    if (identityResult.error || jobResult.error || !identity || !job ||
        !UUID.test(identity.coder_user_id) || job.coder_user_id !== identity.coder_user_id ||
        job.template_id !== templateId || job.status !== 'ready' ||
        !user.email_confirmed_at || user.email?.trim().toLowerCase() !== identity.verified_email ||
        identity.coder_user_id === process.env.CODER_OPERATOR_USER_ID) {
      throw new CostGateError('Private customer workspace ownership or readiness could not be verified.');
    }

    const ownerResponse = await coderApiRequest(`/api/v2/users/${encodeURIComponent(identity.coder_user_id)}`, 'GET');
    const owner = ownerResponse.ok ? await ownerResponse.json().catch(() => null) as CustomerIdentity | null : null;
    if (!owner || owner.id !== identity.coder_user_id || !owner.username ||
        owner.email?.trim().toLowerCase() !== identity.verified_email ||
        owner.login_type !== 'oidc' || owner.status !== 'active' || owner.is_service_account === true) {
      throw new CostGateError('Your Coder account could not be verified.');
    }

    const response = await coderApiRequest(`/api/v2/workspaces/${encodeURIComponent(slot.workspace_id)}`, 'GET');
    const workspace = response.ok ? await response.json().catch(() => null) as CustomerWorkspace | null : null;
    if (!workspace || workspace.id !== slot.workspace_id || workspace.owner_id !== owner.id ||
        workspace.name !== slot.workspace_name || workspace.template_id !== templateId) {
      throw new CostGateError('Coder workspace ownership or template does not match your account.');
    }
    // The template ID alone is insufficient: a user may update a workspace to
    // another version of that template through Coder without using this app.
    if (workspace.latest_build?.template_version_id !== pinnedVersionId) {
      throw new CostGateError('Your IDE uses an unverified template version. Contact support.');
    }
    const status = customerWorkspaceState(workspace);
    if (status === 'running') {
      // This is the Coder workspace landing page, not an unprotected app proxy.
      // Coder requires the customer's separate authenticated browser session.
      const url = `${publicCoderOrigin()}/@${encodeURIComponent(owner.username)}/${encodeURIComponent(workspace.name)}`;
      return NextResponse.json({ status: 'running', url }, { headers: noStore });
    }
    if (status === 'transitioning') {
      return NextResponse.json({ status: 'starting', message: 'Your private IDE is still starting or changing state.' }, { status: 202, headers: noStore });
    }
    return NextResponse.json({ error: status === 'stopped'
      ? 'Your IDE is stopped. It cannot restart until its compute allowance is verified.'
      : 'Your IDE is not running. Contact support; do not create a replacement.' }, { status: 409, headers: noStore });
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
