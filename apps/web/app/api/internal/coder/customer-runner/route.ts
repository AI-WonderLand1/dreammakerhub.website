import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { attachCoderWorkspace, coderApiRequest, coderServiceClient, getCoderSlot } from '@/lib/coder/workspace-slots.server';
import { customerProvisioningGate, verifiedCustomerTemplateId } from '@/lib/coder/customer-provisioning.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Job = {
  slot_id: string; user_id: string; coder_user_id: string; template_id: string;
  cpu: number; memory_gib: number; disk_gib: number; max_compute_ms: number;
};
type RemoteWorkspace = { id?: string; owner_id?: string; template_id?: string; name?: string };

function isRunnerAuthorized(request: Request): boolean {
  const expected = process.env.CODER_CUSTOMER_RUNNER_SECRET;
  const supplied = request.headers.get('authorization');
  if (!expected || expected.length < 32 || !supplied?.startsWith('Bearer ')) return false;
  const a = Buffer.from(supplied.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function verifyExistingOwner(job: Job, slotName: string, workspace: RemoteWorkspace): Promise<string> {
  if (!workspace.id || !UUID.test(workspace.id) || workspace.owner_id !== job.coder_user_id ||
      workspace.template_id !== job.template_id || workspace.name !== slotName) {
    throw new Error('Coder returned mismatched workspace ownership or template');
  }
  return workspace.id;
}

export async function POST(request: Request) {
  if (!isRunnerAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    customerProvisioningGate();
    const templateId = await verifiedCustomerTemplateId();
    const db = coderServiceClient();
    const { data, error } = await db.rpc('claim_coder_customer_job');
    if (error || !Array.isArray(data)) return NextResponse.json({ error: 'Job queue unavailable' }, { status: 503 });
    if (!data.length) return NextResponse.json({ status: 'idle' }, { headers: { 'Cache-Control': 'no-store' } });
    const job = data[0] as Job;
    // Claimed jobs are NEVER automatically re-claimed. A timeout may have
    // created a Coder pod; an operator must reconcile the uncertain outcome.
    try {
      if (job.template_id !== templateId || !UUID.test(job.coder_user_id)) throw new Error('Unverified customer job');
      const slot = await getCoderSlot(job.user_id, job.slot_id);
      if (!slot || slot.state !== 'reserved' || slot.workspace_id ||
          !slot.workspace_name) throw new Error('Workspace reservation mismatch');
      const identity = await db.from('coder_customer_identities')
        .select('coder_user_id,verified_email').eq('user_id', job.user_id).maybeSingle();
      if (identity.error || identity.data?.coder_user_id !== job.coder_user_id) {
        throw new Error('Customer identity binding missing or changed');
      }
      const ownerResponse = await coderApiRequest(`/api/v2/users/${encodeURIComponent(job.coder_user_id)}`, 'GET');
      const owner = ownerResponse.ok ? await ownerResponse.json().catch(() => null) : null;
      if (!owner || owner.id !== job.coder_user_id || owner.status !== 'active' ||
          owner.login_type !== 'oidc' || owner.is_service_account === true ||
          owner.email?.trim().toLowerCase() !== identity.data.verified_email ||
          owner.id === process.env.CODER_OPERATOR_USER_ID) throw new Error('Coder owner could not be reverified');
      const path = `/api/v2/users/${encodeURIComponent(job.coder_user_id)}/workspace/${encodeURIComponent(slot.workspace_name)}`;
      const existing = await coderApiRequest(path, 'GET');
      let workspace: RemoteWorkspace;
      if (existing.ok) {
        workspace = await existing.json() as RemoteWorkspace;
      } else if (existing.status === 404) {
        // Never use /users/me or the operator account. The owner ID comes
        // only from a unique, verified server-side OIDC identity binding.
        const created = await coderApiRequest(`/api/v2/users/${encodeURIComponent(job.coder_user_id)}/workspaces`, 'POST', {
          name: slot.workspace_name, template_id: templateId,
          rich_parameter_values: [
            { name: 'cpu', value: String(job.cpu) },
            { name: 'memory', value: String(job.memory_gib) },
            { name: 'home_disk_size', value: String(job.disk_gib) },
          ],
          ttl_ms: 60 * 60 * 1000,
        });
        if (!created.ok) throw new Error('Coder workspace creation response was not successful');
        workspace = await created.json() as RemoteWorkspace;
      } else {
        throw new Error('Coder workspace lookup failed; creation not attempted');
      }
      const workspaceId = await verifyExistingOwner(job, slot.workspace_name, workspace);
      await attachCoderWorkspace(job.user_id, job.slot_id, workspaceId);
      const usage = await db.from('coder_customer_compute_usage').insert({
        slot_id: job.slot_id, user_id: job.user_id, workspace_id: workspaceId,
        max_ms: job.max_compute_ms, last_checked_at: new Date().toISOString(),
      });
      if (usage.error) throw new Error('Compute ledger could not be initialized');
      const updated = await db.from('coder_customer_jobs').update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('slot_id', job.slot_id).eq('status', 'claimed').select('slot_id').maybeSingle();
      if (updated.error || !updated.data) throw new Error('Could not mark workspace ready');
      return NextResponse.json({ status: 'ready' }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      await db.from('coder_customer_jobs').update({
        status: 'needs_reconciliation', updated_at: new Date().toISOString(),
      }).eq('slot_id', job.slot_id).eq('status', 'claimed');
      // Do not release the slot or create a replacement when Coder's outcome is uncertain.
      return NextResponse.json({ status: 'needs_reconciliation' }, { status: 503 });
    }
  } catch {
    return NextResponse.json({ error: 'Customer runner is not ready' }, { status: 503 });
  }
}
