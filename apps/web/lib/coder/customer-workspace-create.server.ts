import 'server-only';
import { CostGateError } from '@/lib/billing/cost-guard.server';
import {
  attachCoderWorkspace,
  CODER_TTL_MS,
  coderApiRequest,
  coderServiceClient,
  getCoderSlot,
} from '@/lib/coder/workspace-slots.server';
import {
  assertFreshUsageController,
  customerProvisioningGate,
  verifiedCustomerTemplateId,
} from '@/lib/coder/customer-provisioning.server';

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

type Job = {
  slot_id: string;
  user_id: string;
  coder_user_id: string;
  template_id: string;
  machine_profile: 'micro' | 'standard';
  compute_multiplier: 1 | 2;
  cpu: 1 | 2;
  memory_gib: 2 | 4;
  disk_gib: number;
  max_compute_ms: number;
  status: 'queued' | 'claimed' | 'ready' | 'needs_reconciliation';
};

type RemoteWorkspace = {
  id?: string;
  owner_id?: string;
  template_id?: string;
  name?: string;
};

async function markNeedsReconciliation(slotId: string): Promise<void> {
  await coderServiceClient().from('coder_customer_jobs').update({
    status: 'needs_reconciliation',
    updated_at: new Date().toISOString(),
  }).eq('slot_id', slotId).eq('status', 'claimed');
}

function verifiedWorkspace(job: Job, workspaceName: string, workspace: RemoteWorkspace): string {
  if (!workspace.id || !UUID.test(workspace.id) ||
      workspace.owner_id !== job.coder_user_id ||
      workspace.template_id !== job.template_id ||
      workspace.name !== workspaceName) {
    throw new Error('Coder returned mismatched workspace ownership or template');
  }
  return workspace.id;
}

/**
 * Provision one newly queued customer workspace in the same request that
 * reserved it. This removes the old Kubernetes worker dependency while keeping
 * the durable slot/job records and fail-closed reconciliation behavior.
 */
export async function provisionCustomerWorkspaceNow(
  userId: string,
  slotId: string,
): Promise<'ready' | 'needs_reconciliation'> {
  customerProvisioningGate();
  const templateId = await verifiedCustomerTemplateId();
  await assertFreshUsageController();

  const versionId = process.env.CODER_CUSTOMER_TEMPLATE_VERSION_ID;
  const operatorId = process.env.CODER_OPERATOR_USER_ID;
  if (!versionId || !UUID.test(versionId) || !operatorId || !UUID.test(operatorId)) {
    throw new CostGateError('Pinned customer template and operator identity are required.');
  }

  const db = coderServiceClient();
  const claim = await db.from('coder_customer_jobs').update({
    status: 'claimed',
    updated_at: new Date().toISOString(),
  })
    .eq('slot_id', slotId)
    .eq('user_id', userId)
    .eq('status', 'queued')
    .select('slot_id,user_id,coder_user_id,template_id,machine_profile,compute_multiplier,cpu,memory_gib,disk_gib,max_compute_ms,status')
    .maybeSingle();

  if (claim.error || !claim.data) {
    const existing = await db.from('coder_customer_jobs')
      .select('status').eq('slot_id', slotId).eq('user_id', userId).maybeSingle();
    if (!existing.error && existing.data?.status === 'ready') return 'ready';
    if (!existing.error && existing.data?.status === 'needs_reconciliation') return 'needs_reconciliation';
    throw new CostGateError('Workspace setup could not claim its reserved job.');
  }

  const job = claim.data as Job;

  try {
    if (job.template_id !== templateId ||
        !UUID.test(job.coder_user_id) ||
        !['micro', 'standard'].includes(job.machine_profile) ||
        ![1, 2].includes(job.cpu) ||
        ![2, 4].includes(job.memory_gib)) {
      throw new Error('Unverified customer job');
    }

    const slot = await getCoderSlot(userId, slotId);
    if (!slot || slot.state !== 'reserved' || slot.workspace_id || !slot.workspace_name) {
      throw new Error('Workspace reservation mismatch');
    }

    const identity = await db.from('coder_customer_identities')
      .select('coder_user_id,verified_email')
      .eq('user_id', userId)
      .maybeSingle();

    if (identity.error || identity.data?.coder_user_id !== job.coder_user_id) {
      throw new Error('Customer identity binding missing or changed');
    }

    const ownerResponse = await coderApiRequest(
      `/api/v2/users/${encodeURIComponent(job.coder_user_id)}`,
      'GET',
    );
    const owner = ownerResponse.ok ? await ownerResponse.json().catch(() => null) : null;
    if (!owner || owner.id !== job.coder_user_id || owner.status !== 'active' ||
        owner.login_type !== 'oidc' || owner.is_service_account === true ||
        owner.email?.trim().toLowerCase() !== identity.data.verified_email ||
        owner.id === operatorId) {
      throw new Error('Coder owner could not be reverified');
    }

    const workspacePath =
      `/api/v2/users/${encodeURIComponent(job.coder_user_id)}/workspace/${encodeURIComponent(slot.workspace_name)}`;
    const existing = await coderApiRequest(workspacePath, 'GET');

    let workspace: RemoteWorkspace;
    if (existing.ok) {
      workspace = await existing.json() as RemoteWorkspace;
    } else if (existing.status === 404) {
      const created = await coderApiRequest(
        `/api/v2/users/${encodeURIComponent(job.coder_user_id)}/workspaces`,
        'POST',
        {
          name: slot.workspace_name,
          template_version_id: versionId,
          rich_parameter_values: [
            { name: 'machine_profile', value: job.machine_profile },
          ],
          ttl_ms: CODER_TTL_MS,
        },
      );
      if (!created.ok) throw new Error('Coder workspace creation response was not successful');
      workspace = await created.json() as RemoteWorkspace;
    } else {
      throw new Error('Coder workspace lookup failed; creation not attempted');
    }

    const workspaceId = verifiedWorkspace(job, slot.workspace_name, workspace);
    await attachCoderWorkspace(userId, slotId, workspaceId);

    const usage = await db.from('coder_customer_compute_usage').insert({
      slot_id: slotId,
      user_id: userId,
      workspace_id: workspaceId,
      compute_multiplier: job.compute_multiplier,
      max_ms: job.max_compute_ms,
      last_checked_at: new Date().toISOString(),
    });
    if (usage.error) throw new Error('Compute ledger could not be initialized');

    const updated = await db.from('coder_customer_jobs').update({
      status: 'ready',
      updated_at: new Date().toISOString(),
    })
      .eq('slot_id', slotId)
      .eq('user_id', userId)
      .eq('status', 'claimed')
      .select('slot_id')
      .maybeSingle();

    if (updated.error || !updated.data) throw new Error('Could not mark workspace ready');
    return 'ready';
  } catch {
    await markNeedsReconciliation(slotId);
    return 'needs_reconciliation';
  }
}
