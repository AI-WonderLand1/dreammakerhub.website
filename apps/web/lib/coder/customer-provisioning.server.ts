import 'server-only';
import type { User } from '@supabase/supabase-js';
import { CostGateError, verifiedCostPlan } from '@/lib/billing/cost-guard.server';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import { coderApiConfig, coderServiceClient } from '@/lib/coder/workspace-slots.server';
import { verifiedCustomerCoderOwner } from '@/lib/coder/customer-identity.server';
import { workspaceProfile } from '@/lib/coder/workspace-profiles';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';
import { getProjectMetadata } from '@/lib/projects/storage';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKSPACE_NAME = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export function customerProvisioningGate(): void {
  // Keep a deliberate operator on/off switch, but do not require a pile of
  // manually asserted "...VERIFIED" flags. Identity, template and app-domain
  // checks below remain fail-closed.
  if (process.env.CODER_CUSTOMER_PROVISIONING_ENABLED !== 'true' ||
      process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('Customer workspace creation is disabled by the operator.');
  }
  if (!process.env.CODER_WILDCARD_ACCESS_URL) {
    throw new CostGateError('Coder wildcard app routing is not configured.');
  }
}

export type VerifiedCustomerTemplate = {
  id: string;
  versionId: string;
  name: string;
};

/**
 * Re-read the published Google Docker template from Coder for every customer
 * launch. The template itself enforces the bounded machine_profile choices and
 * operator-controlled image, so users never supply a container image or Docker
 * socket.
 */
export async function verifiedCustomerTemplate(): Promise<VerifiedCustomerTemplate> {
  const config = await getCoderLaunchConfig();
  if (config.templateName !== (process.env.CODER_IDE_TEMPLATE_NAME || 'ai-wonderland-google')) {
    throw new CostGateError('The published Coder template does not match the approved Google Docker template.');
  }

  const profiles = new Set(config.machineProfiles.map((profile) => profile.value));
  if (!profiles.has('micro') || !profiles.has('standard') ||
      [...profiles].some((profile) => !['micro', 'standard'].includes(profile))) {
    throw new CostGateError('The published Coder template has unapproved customer machine profiles.');
  }

  if (!UUID.test(config.templateId) || !UUID.test(config.templateVersionId)) {
    throw new CostGateError('Coder returned an invalid published template identity.');
  }

  return {
    id: config.templateId,
    versionId: config.templateVersionId,
    name: config.templateName,
  };
}

export async function verifiedCustomerTemplateId(): Promise<string> {
  return (await verifiedCustomerTemplate()).id;
}

export async function queueCustomerWorkspace(user: User, input: unknown): Promise<string> {
  customerProvisioningGate();
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CostGateError('Invalid workspace form.', 429);
  }
  const body = input as Record<string, unknown>;
  const name = typeof body.workspaceName === 'string' ? body.workspaceName.trim() : '';
  const profile = workspaceProfile(body.machineProfile);
  if (!WORKSPACE_NAME.test(name) || !profile) {
    throw new CostGateError('Choose a valid workspace name and machine profile.', 429);
  }
  // The first Google Docker customer rollout is intentionally bounded to the
  // two profiles enforced by the published customer template.
  if (profile.cpu > 2 || profile.memoryGiB > 4 || !['micro', 'standard'].includes(profile.id)) {
    throw new CostGateError('That machine profile is not enabled for the current customer rollout.', 429);
  }
  if (body.repository || body.ideImage || body.sshPublicKey || body.diskGiB !== undefined) {
    throw new CostGateError('External repository and image overrides are not supported by the customer IDE.', 429);
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  if (projectId) {
    if (!UUID.test(projectId)) {
      throw new CostGateError('Choose a valid AI WONDERLAND project.', 429);
    }
    try {
      await getProjectMetadata(projectId, user.id);
    } catch {
      throw new CostGateError('That AI WONDERLAND project is unavailable or does not belong to this account.', 402);
    }
  }
  const plan = await verifiedCostPlan(user.id);
  const coderUserId = await verifiedCustomerCoderOwner(user);
  const templateId = await verifiedCustomerTemplateId();
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
    template_id: templateId,
    machine_profile: profile.id,
    compute_multiplier: profile.computeMultiplier,
    cpu: profile.cpu,
    memory_gib: profile.memoryGiB,
    disk_gib: 10,
    // Legacy schema field retained for compatibility; time-based IDE limits are disabled.
    max_compute_ms: 86_400_000,
  });
  if (jobError) {
    throw new CostGateError('Workspace reserved but the setup queue failed. Contact support; do not retry with another name.');
  }
  return slotId;
}
