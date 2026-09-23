import 'server-only';
import type { User } from '@supabase/supabase-js';
import { CostGateError, verifiedCostPlan } from '@/lib/billing/cost-guard.server';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import { coderApiConfig, coderApiRequest, coderServiceClient, assertCoderResourceBudget } from '@/lib/coder/workspace-slots.server';
import { verifiedCustomerCoderOwner } from '@/lib/coder/customer-identity.server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKSPACE_NAME = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export function customerProvisioningGate(): void {
  if (process.env.CODER_CUSTOMER_PROVISIONING_ENABLED !== 'true' ||
      process.env.CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED !== 'true' ||
      process.env.CODER_CUSTOMER_HARD_STOP_VERIFIED !== 'true' ||
      process.env.CODER_SUPABASE_OIDC_VERIFIED !== 'true') {
    throw new CostGateError('Private customer IDEs are pending identity, pod isolation and compute-limit verification.');
  }
  if (process.env.BILLABLE_OPERATIONS_ENABLED !== 'true' ||
      process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('New workspace creation is paused.');
  }
}

/** Validate the actual published customer template; never fall back to an operator template. */
export async function verifiedCustomerTemplateId(): Promise<string> {
  const templateId = process.env.CODER_CUSTOMER_TEMPLATE_ID;
  const versionId = process.env.CODER_CUSTOMER_TEMPLATE_VERSION_ID;
  const templateName = process.env.CODER_CUSTOMER_TEMPLATE_NAME;
  const operatorTemplateId = process.env.CODER_OPERATOR_TEMPLATE_ID;
  if (!templateId || !versionId || !templateName || !operatorTemplateId ||
      !UUID.test(templateId) || !UUID.test(versionId) || !UUID.test(operatorTemplateId)) {
    throw new CostGateError('Both the operator template and a verified, pinned customer-only template must be configured.');
  }
  if (templateId === operatorTemplateId) {
    throw new CostGateError('The operator template cannot be used for customer provisioning.');
  }
  const response = await coderApiRequest(`/api/v2/templates/${encodeURIComponent(templateId)}`, 'GET');
  const template = response.ok ? await response.json().catch(() => null) : null;
  if (!template || template.id !== templateId || template.name !== templateName ||
      template.active_version_id !== versionId) {
    throw new CostGateError('The customer template has changed or is not published. Review it before creating pods.');
  }
  return templateId;
}

export async function assertFreshUsageController(): Promise<void> {
  const { data, error } = await coderServiceClient().from('coder_customer_controller')
    .select('last_heartbeat_at').eq('id', true).maybeSingle();
  const lastSeen = data?.last_heartbeat_at ? Date.parse(data.last_heartbeat_at) : NaN;
  if (error || !Number.isFinite(lastSeen) || Date.now() - lastSeen > 90_000 || lastSeen > Date.now() + 5_000) {
    throw new CostGateError('The IDE time-limit controller is not running. New pods are paused.');
  }
}

export async function queueCustomerWorkspace(user: User, input: unknown): Promise<string> {
  customerProvisioningGate();
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CostGateError('Invalid workspace form.', 429);
  }
  const body = input as Record<string, unknown>;
  const name = typeof body.workspaceName === 'string' ? body.workspaceName.trim() : '';
  const cpu = body.cpu;
  const memory = body.memory;
  if (!WORKSPACE_NAME.test(name) || typeof cpu !== 'number' || typeof memory !== 'number') {
    throw new CostGateError('Choose a valid workspace name, CPU and memory.', 429);
  }
  assertCoderResourceBudget(cpu, memory);
  if (![1, 2].includes(cpu) || ![2, 4].includes(memory)) {
    throw new CostGateError('Choose an approved customer CPU and memory profile.', 429);
  }
  if (body.repository || body.ideImage || body.sshPublicKey || body.diskGiB !== undefined) {
    throw new CostGateError('Only an approved blank IDE and fixed 10 GiB disk are available in this pilot.', 429);
  }
  const plan = await verifiedCostPlan(user.id);
  const computeEnv = plan === 'free'
    ? 'CODER_FREE_COMPUTE_MINUTES'
    : plan === 'team'
      ? 'CODER_TEAM_COMPUTE_MINUTES'
      : 'CODER_PRO_COMPUTE_MINUTES';
  const configuredMinutes = process.env[computeEnv];
  const minutes = Number(configuredMinutes);
  if (!configuredMinutes || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440) {
    throw new CostGateError('Your plan’s per-workspace safety allowance is not configured.');
  }
  const coderUserId = await verifiedCustomerCoderOwner(user);
  const templateId = await verifiedCustomerTemplateId();
  await assertFreshUsageController();
  const limit = PLAN_LIMITS[plan].workspacesLimit;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 999999) {
    throw new CostGateError('Customer saved-workspace allowance is not configured.');
  }
  const db = coderServiceClient();
  const { data: slotId, error: reservationError } = await db.rpc('reserve_coder_workspace_slot', {
    p_user_id: user.id, p_workspace_name: name, p_origin: coderApiConfig().url, p_limit: limit,
  });
  if (reservationError) throw new CostGateError('Workspace reservation failed. No pod was requested.');
  if (typeof slotId !== 'string' || !UUID.test(slotId)) {
    throw new CostGateError('Workspace allowance reached or name already reserved.', 429);
  }
  const { error: jobError } = await db.from('coder_customer_jobs').insert({
    slot_id: slotId, user_id: user.id, coder_user_id: coderUserId,
    template_id: templateId, cpu, memory_gib: memory, disk_gib: 10,
    max_compute_ms: minutes * 60_000,
  });
  if (jobError) {
    throw new CostGateError('Workspace reserved but the setup queue failed. Contact support; do not retry with another name.');
  }
  return slotId;
}
