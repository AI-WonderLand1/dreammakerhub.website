import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { coderApiConfig, coderApiRequest, coderServiceClient, getCoderSlot, markCoderSlotDeleting, releaseDeletedCoderSlot } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slotId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { 'Cache-Control': 'private, no-store' };
type CoderIdentity = { id?: string; email?: string; login_type?: string; status?: string; is_service_account?: boolean };
type RemoteWorkspace = {
  id?: string; name?: string; owner_id?: string; template_id?: string;
  latest_build?: { status?: string; transition?: string };
};

/** Verify the owner of a customer allocation before using the privileged Coder token.
 * An app slot by itself never authorizes deletion of a Coder resource.
 * This is also checked when Coder returns 404, before releasing a paid slot.
 */
async function customerDeletionOwner(userId: string, email: string | undefined,
  confirmed: string | undefined, slotId: string): Promise<{ ownerId: string; templateId: string }> {
  const operatorId = process.env.CODER_OPERATOR_USER_ID;
  const approvedTemplateId = process.env.CODER_CUSTOMER_TEMPLATE_ID;
  if (process.env.CODER_SUPABASE_OIDC_VERIFIED !== 'true' ||
      !operatorId || !UUID.test(operatorId) || !approvedTemplateId || !UUID.test(approvedTemplateId) ||
      !confirmed || !email) {
    throw new CostGateError('Customer deletion requires verified independent Coder identities. Contact support.');
  }
  const expectedEmail = email.trim().toLowerCase();
  const db = coderServiceClient();
  const [identityResult, jobResult] = await Promise.all([
    db.from('coder_customer_identities').select('coder_user_id,verified_email')
      .eq('user_id', userId).maybeSingle(),
    db.from('coder_customer_jobs').select('coder_user_id,template_id,status')
      .eq('user_id', userId).eq('slot_id', slotId).maybeSingle(),
  ]);
  const identity = identityResult.data;
  const job = jobResult.data;
  if (identityResult.error || jobResult.error || !identity || !job ||
      !UUID.test(identity.coder_user_id) || identity.coder_user_id === operatorId ||
      identity.verified_email !== expectedEmail || job.coder_user_id !== identity.coder_user_id ||
      job.template_id !== approvedTemplateId || job.status !== 'ready') {
    throw new CostGateError('Customer workspace ownership is not verified. No deletion was attempted.');
  }
  const response = await coderApiRequest(`/api/v2/users/${encodeURIComponent(identity.coder_user_id)}`, 'GET');
  const owner = response.ok ? await response.json().catch(() => null) as CoderIdentity | null : null;
  if (!owner || owner.id !== identity.coder_user_id || owner.email?.trim().toLowerCase() !== expectedEmail ||
      owner.login_type !== 'oidc' || owner.status !== 'active' || owner.is_service_account === true) {
    throw new CostGateError('Coder customer account cannot be verified. No deletion was attempted.');
  }
  return { ownerId: owner.id, templateId: approvedTemplateId };
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  const { slotId } = await params;
  if (!UUID.test(slotId)) return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400, headers: noStore });
  try {
    const slot = await getCoderSlot(user.id, slotId);
    if (!slot) return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: noStore });
    if (!slot.workspace_id || !UUID.test(slot.workspace_id) || slot.state === 'reserved') {
      return NextResponse.json({ error: 'This workspace may still be provisioning. Contact support to reconcile its Coder ID; no allocation was freed.' }, { status: 409, headers: noStore });
    }
    // A different Coder deployment may return 404 for a still-running old pod.
    if (slot.coder_api_origin !== coderApiConfig().url) {
      throw new CostGateError('Coder server has changed. Slot remains allocated until the original server is reconciled.');
    }
    const operator = isConfiguredCoderOperator(user.id);
    let expectedOwnerId: string;
    let expectedTemplateId: string | null = null;
    if (operator) {
      const identityResponse = await coderApiRequest('/api/v2/users/me', 'GET');
      const identity = identityResponse.ok ? await identityResponse.json().catch(() => null) as CoderIdentity | null : null;
      const configuredId = process.env.CODER_OPERATOR_USER_ID;
      if (!identity?.id || !UUID.test(identity.id) ||
          (configuredId && identity.id !== configuredId)) {
        throw new CostGateError('Coder operator identity could not be verified. No deletion was attempted.');
      }
      expectedOwnerId = identity.id;
    } else {
      const customer = await customerDeletionOwner(user.id, user.email, user.email_confirmed_at, slot.id);
      expectedOwnerId = customer.ownerId;
      expectedTemplateId = customer.templateId;
    }
    const buildInfoResponse = await coderApiRequest('/api/v2/buildinfo', 'GET');
    const buildInfo = buildInfoResponse.ok ? await buildInfoResponse.json().catch(() => null) : null;
    if (typeof buildInfo?.version !== 'string' || !buildInfo.version.trim()) {
      throw new CostGateError('Coder server identity could not be verified. Slot remains allocated.');
    }
    const path = `/api/v2/workspaces/${encodeURIComponent(slot.workspace_id)}`;
    const current = await coderApiRequest(path, 'GET');
    if (current.status === 404) {
      // A single 404 may be an authorization or routing error. Check by the
      // separately verified owner and name before freeing the database slot.
      const byName = await coderApiRequest(
        `/api/v2/users/${encodeURIComponent(expectedOwnerId)}/workspace/${encodeURIComponent(slot.workspace_name)}`, 'GET');
      if (byName.status !== 404) {
        throw new CostGateError('Coder deletion could not be confirmed by owner and name. Slot remains allocated.');
      }
      await markCoderSlotDeleting(user.id, slot.id);
      await releaseDeletedCoderSlot(user.id, slot.id, slot.workspace_id);
      return NextResponse.json({ deleted: true, message: 'Coder confirmed workspace is absent; slot released.' }, { headers: noStore });
    }
    if (!current.ok) throw new CostGateError('Cannot confirm Coder workspace state. Slot remains allocated.');
    const workspace = await current.json().catch(() => null) as RemoteWorkspace | null;
    if (!workspace || workspace.id !== slot.workspace_id || workspace.name !== slot.workspace_name ||
        workspace.owner_id !== expectedOwnerId ||
        (expectedTemplateId && workspace.template_id !== expectedTemplateId)) {
      throw new CostGateError('Coder workspace ownership or template mismatch. No deletion was attempted.');
    }
    if (workspace.latest_build?.status === 'failed' && workspace.latest_build.transition === 'delete') {
      throw new CostGateError('Coder deletion failed. Slot remains allocated pending administrator cleanup.');
    }
    if (slot.state !== 'deleting' && workspace.latest_build?.transition !== 'delete') {
      // An accepted build request only queues deletion; it does not prove the
      // workspace or its persistent volume has been removed.
      const deletion = await coderApiRequest(`${path}/builds`, 'POST', { transition: 'delete' });
      if (!deletion.ok) throw new CostGateError('Coder did not accept workspace deletion. Slot remains allocated.');
    }
    await markCoderSlotDeleting(user.id, slot.id);
    const verification = await coderApiRequest(path, 'GET');
    if (verification.status === 404) {
      await releaseDeletedCoderSlot(user.id, slot.id, slot.workspace_id);
      return NextResponse.json({ deleted: true, message: 'Coder confirmed deletion; slot released.' }, { headers: noStore });
    }
    if (!verification.ok) throw new CostGateError('Coder deletion status is unknown. Slot remains allocated.');
    const remaining = await verification.json().catch(() => null) as RemoteWorkspace | null;
    if (!remaining || remaining.id !== slot.workspace_id || remaining.owner_id !== expectedOwnerId ||
        (expectedTemplateId && remaining.template_id !== expectedTemplateId)) {
      throw new CostGateError('Coder ownership changed during deletion. Slot remains allocated.');
    }
    return NextResponse.json({ deleted: false, message: 'Deletion is in progress. Your slot stays reserved until Coder confirms deletion. Retry this action in a moment.' }, { status: 202, headers: noStore });
  } catch (cause) {
    return costGateResponse(cause);
  }
}
