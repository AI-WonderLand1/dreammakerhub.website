import 'server-only';
import type { User } from '@supabase/supabase-js';
import { CostGateError, verifiedCostPlan } from '@/lib/billing/cost-guard.server';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import { coderApiConfig, coderApiRequest, coderServiceClient } from '@/lib/coder/workspace-slots.server';
import { verifiedCustomerCoderOwner } from '@/lib/coder/customer-identity.server';
import { workspaceProfile } from '@/lib/coder/workspace-profiles';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKSPACE_NAME = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

type CoderTemplate = {
  id?: string;
  name?: string;
  active_version_id?: string;
};

type RemoteWorkspace = {
  id?: string;
  name?: string;
  owner_id?: string;
  template_id?: string;
  latest_build?: { status?: string; transition?: string };
};

export function customerProvisioningGate(): void {
  if (process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('New Coder workspaces are disabled by the operator.');
  }
  coderApiConfig();
}

/**
 * Use the Coder template already configured for DreamMakerHub.
 * vCluster/Kubernetes placement belongs to the Coder template and platform,
 * not to a second Railway or AWS-specific provisioning path in this app.
 */
export async function verifiedCustomerTemplate(): Promise<{ id: string; versionId: string; name: string }> {
  const configuredId = process.env.CODER_CUSTOMER_TEMPLATE_ID || process.env.CODER_TEMPLATE_ID;
  if (!configuredId || !UUID.test(configuredId)) {
    throw new CostGateError('The Coder IDE template is not configured.');
  }

  const response = await coderApiRequest(`/api/v2/templates/${encodeURIComponent(configuredId)}`, 'GET');
  const template = response.ok ? await response.json().catch(() => null) as CoderTemplate | null : null;
  if (!template || template.id !== configuredId || !template.active_version_id || !UUID.test(template.active_version_id)) {
    throw new CostGateError('The configured Coder IDE template is not published.');
  }

  return {
    id: configuredId,
    versionId: template.active_version_id,
    name: template.name || 'DreamMakerHub IDE',
  };
}

/** Kept for callers that only need the template ID. */
export async function verifiedCustomerTemplateId(): Promise<string> {
  return (await verifiedCustomerTemplate()).id;
}

export async function provisionCustomerWorkspace(
  user: User,
  input: unknown,
): Promise<{ slotId: string; status: 'ready' | 'starting' }> {
  customerProvisioningGate();

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CostGateError('Invalid workspace form.', 400);
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.workspaceName === 'string' ? body.workspaceName.trim() : '';
  const profile = workspaceProfile(body.machineProfile);
  if (!WORKSPACE_NAME.test(name) || !profile) {
    throw new CostGateError('Choose a valid workspace name and machine profile.', 400);
  }

  if (body.repository || body.ideImage || body.sshPublicKey || body.diskGiB !== undefined) {
    throw new CostGateError('Only an approved blank IDE with a fixed 10 GiB home disk is available.', 400);
  }

  const plan = await verifiedCostPlan(user.id);
  const limit = PLAN_LIMITS[plan].workspacesLimit;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 999999) {
    throw new CostGateError('Your saved-workspace allowance is not configured.');
  }

  const coderUserId = await verifiedCustomerCoderOwner(user);
  const template = await verifiedCustomerTemplate();
  const db = coderServiceClient();

  const { data: slotId, error: reservationError } = await db.rpc('reserve_coder_workspace_slot', {
    p_user_id: user.id,
    p_workspace_name: name,
    p_origin: coderApiConfig().url,
    p_limit: limit,
  });

  if (reservationError) throw new CostGateError('Workspace reservation failed. No Coder workspace was requested.');
  if (typeof slotId !== 'string' || !UUID.test(slotId)) {
    throw new CostGateError('Workspace allowance reached or name already reserved.', 429);
  }

  const parameterResponse = await coderApiRequest(
    `/api/v2/templateversions/${encodeURIComponent(template.versionId)}/rich-parameters`,
    'GET',
  );
  const parameters = parameterResponse.ok ? await parameterResponse.json().catch(() => []) : [];
  const parameterNames = new Set(
    Array.isArray(parameters)
      ? parameters.map((parameter: { name?: unknown }) => parameter.name).filter((name: unknown): name is string => typeof name === 'string')
      : [],
  );
  const richParameterValues: { name: string; value: string }[] = [];
  if (parameterNames.has('ide_image')) richParameterValues.push({ name: 'ide_image', value: 'linux' });
  if (parameterNames.has('machine_profile')) {
    richParameterValues.push({ name: 'machine_profile', value: profile.id });
  } else {
    if (parameterNames.has('cpu')) richParameterValues.push({ name: 'cpu', value: String(profile.cpu) });
    if (parameterNames.has('memory')) richParameterValues.push({ name: 'memory', value: String(profile.memoryGiB) });
  }
  if (parameterNames.has('home_disk_size')) richParameterValues.push({ name: 'home_disk_size', value: '10' });

  const existing = await coderApiRequest(
    `/api/v2/users/${encodeURIComponent(coderUserId)}/workspace/${encodeURIComponent(name)}`,
    'GET',
  );

  let workspace: RemoteWorkspace | null = null;
  if (existing.ok) {
    workspace = await existing.json().catch(() => null) as RemoteWorkspace | null;
  } else if (existing.status === 404) {
    const created = await coderApiRequest(
      `/api/v2/users/${encodeURIComponent(coderUserId)}/workspaces`,
      'POST',
      {
        name,
        template_version_id: template.versionId,
        rich_parameter_values: richParameterValues,
        ttl_ms: 60 * 60 * 1000,
      },
    );

    if (!created.ok) {
      throw new CostGateError('Coder rejected workspace creation. The reservation remains held for reconciliation.');
    }
    workspace = await created.json().catch(() => null) as RemoteWorkspace | null;
  } else {
    throw new CostGateError('Coder workspace lookup failed. No replacement workspace was created.');
  }

  if (!workspace?.id || !UUID.test(workspace.id) ||
      workspace.name !== name ||
      workspace.owner_id !== coderUserId ||
      workspace.template_id !== template.id) {
    throw new CostGateError('Coder returned a workspace that did not match the authenticated customer.');
  }

  const jobWrite = await db.from('coder_customer_jobs').upsert({
    slot_id: slotId,
    user_id: user.id,
    coder_user_id: coderUserId,
    template_id: template.id,
    machine_profile: profile.id,
    compute_multiplier: profile.computeMultiplier,
    cpu: profile.cpu,
    memory_gib: profile.memoryGiB,
    disk_gib: 10,
    max_compute_ms: 60 * 60 * 1000,
    status: 'ready',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slot_id' });

  if (jobWrite.error) {
    throw new CostGateError('Coder created the workspace but DreamMakerHub could not record its owner. Do not create a duplicate.');
  }

  const usageWrite = await db.from('coder_customer_compute_usage').upsert({
    slot_id: slotId,
    workspace_id: workspace.id,
    user_id: user.id,
    compute_multiplier: profile.computeMultiplier,
    max_ms: 60 * 60 * 1000,
    last_checked_at: new Date().toISOString(),
  }, { onConflict: 'slot_id' });

  if (usageWrite.error) {
    throw new CostGateError('Coder created the workspace but DreamMakerHub could not initialize usage tracking. Do not create a duplicate.');
  }

  const attach = await db.from('coder_workspace_slots')
    .update({ workspace_id: workspace.id, state: 'provisioned', updated_at: new Date().toISOString() })
    .eq('id', slotId).eq('user_id', user.id).eq('state', 'reserved')
    .select('id').maybeSingle();

  if (attach.error || !attach.data) {
    throw new CostGateError('Coder created the workspace but DreamMakerHub could not finish tracking it. Do not create a duplicate.');
  }

  const status = workspace.latest_build?.status;
  return { slotId, status: status === 'running' ? 'ready' : 'starting' };
}
