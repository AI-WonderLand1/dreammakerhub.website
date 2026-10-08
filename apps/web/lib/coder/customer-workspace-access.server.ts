import 'server-only';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError } from '@/lib/billing/cost-guard.server';
import {
  coderApiConfig,
  coderApiRequest,
  coderServiceClient,
  getCoderSlot,
} from '@/lib/coder/workspace-slots.server';
import {
  customerProvisioningGate,
  verifiedCustomerTemplateId,
} from '@/lib/coder/customer-provisioning.server';
import { verifiedCustomerCoderOwner } from '@/lib/coder/customer-identity.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';

export type CoderUser = {
  id?: string;
  username?: string;
  email?: string;
  login_type?: string;
  status?: string;
  is_service_account?: boolean;
};

type CoderApp = {
  slug?: string;
  subdomain?: boolean;
  subdomain_name?: string;
};

type CoderAgent = {
  name?: string;
  apps?: CoderApp[];
};

export type CoderWorkspace = {
  id?: string;
  name?: string;
  owner_id?: string;
  owner_name?: string;
  template_id?: string;
  status?: string;
  latest_build?: {
    status?: string;
    transition?: string;
    resources?: Array<{
      agents?: CoderAgent[];
    }>;
  };
};

export const CUSTOMER_WORKSPACE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coderWildcardHostPattern(): string {
  const configured = process.env.CODER_WILDCARD_ACCESS_URL?.trim();
  if (!configured) {
    throw new CostGateError('Coder wildcard app routing is not configured.');
  }

  const wildcardHost = configured
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .toLowerCase();

  if ((wildcardHost.match(/\*/g) || []).length !== 1 ||
      wildcardHost.includes('/') ||
      wildcardHost.includes('@')) {
    throw new CostGateError('Coder wildcard app routing is invalid.');
  }

  return wildcardHost;
}

export function codeServerUrl(workspace: CoderWorkspace): string | null {
  const agents = workspace.latest_build?.resources
    ?.flatMap((resource) => resource.agents || []) || [];
  const wildcardHost = coderWildcardHostPattern();

  for (const agent of agents) {
    const app = agent.apps?.find((candidate) => candidate.slug === 'code-server');
    if (!app) continue;

    if (app.subdomain === true &&
        typeof app.subdomain_name === 'string' &&
        app.subdomain_name.length > 0) {
      const reported = app.subdomain_name.trim().toLowerCase();
      if (!reported || reported.includes('/') || reported.includes('@') || reported.includes(':')) {
        throw new CostGateError('Coder returned an invalid IDE app hostname.');
      }

      const hostname = reported.includes('.')
        ? reported
        : wildcardHost.replace('*', reported);

      const [before, after] = wildcardHost.split('*');
      if (!hostname.startsWith(before) || !hostname.endsWith(after)) {
        throw new CostGateError('Coder returned an IDE app outside the configured wildcard domain.');
      }

      return `https://${hostname}`;
    }
  }

  if (workspace.owner_name && workspace.name) {
    const owner = workspace.owner_name.trim().toLowerCase();
    const workspaceName = workspace.name.trim().toLowerCase();
    const appLabel = `code-server--${workspaceName}--${owner}`;

    if (appLabel.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(appLabel)) {
      throw new CostGateError('Coder returned workspace identity that cannot form a safe IDE hostname.');
    }

    return `https://${wildcardHost.replace('*', appLabel)}`;
  }

  return null;
}

export function workspaceState(workspace: CoderWorkspace): string {
  if (workspace.status) return workspace.status;
  const transition = workspace.latest_build?.transition;
  const build = workspace.latest_build?.status;
  if (build === 'succeeded' && transition === 'start') return 'running';
  if (build === 'succeeded' && transition === 'stop') return 'stopped';
  if (build === 'succeeded' && transition === 'delete') return 'deleted';
  if (build === 'running' || build === 'pending') {
    if (transition === 'start') return 'starting';
    if (transition === 'stop') return 'stopping';
    if (transition === 'delete') return 'deleting';
  }
  return build || 'unknown';
}

export async function verifiedCustomerWorkspace(
  request: Request,
  slotId: string,
): Promise<CoderWorkspace> {
  const user = await authenticatedSupabaseUser(request);
  if (!user) throw new CostGateError('Unauthorized', 401);

  customerProvisioningGate();
  const templateId = await verifiedCustomerTemplateId();
  const slot = await getCoderSlot(user.id, slotId);
  if (!slot || slot.state !== 'provisioned' || !slot.workspace_id || !CUSTOMER_WORKSPACE_UUID.test(slot.workspace_id)) {
    throw new CostGateError('Workspace is not ready yet.', 409);
  }
  if (slot.coder_api_origin !== coderApiConfig().url) {
    throw new CostGateError('This workspace belongs to a different Coder deployment. Contact support.');
  }

  const coderUserId = await verifiedCustomerCoderOwner(user);
  const operatorId = process.env.CODER_OPERATOR_USER_ID;
  const operator = isConfiguredCoderOperator(user.id);
  if (!operatorId || !CUSTOMER_WORKSPACE_UUID.test(operatorId) ||
      (operator ? coderUserId !== operatorId : coderUserId === operatorId)) {
    throw new CostGateError('Coder identity does not match the signed-in AI WONDERLAND account role.');
  }

  const db = coderServiceClient();
  const job = await db.from('coder_customer_jobs')
    .select('coder_user_id,template_id,status')
    .eq('slot_id', slotId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (job.error || !job.data || job.data.status !== 'ready' ||
      job.data.coder_user_id !== coderUserId || job.data.template_id !== templateId) {
    throw new CostGateError('Workspace ownership is not verified.');
  }

  const ownerResponse = await coderApiRequest(
    `/api/v2/users/${encodeURIComponent(coderUserId)}`,
    'GET',
  );
  const owner = ownerResponse.ok
    ? await ownerResponse.json().catch(() => null) as CoderUser | null
    : null;
  const expectedEmail = user.email?.trim().toLowerCase();
  if (!owner?.id || owner.id !== coderUserId || !owner.username ||
      (!operator && owner.login_type !== 'oidc') || owner.status !== 'active' ||
      owner.is_service_account === true ||
      !expectedEmail || owner.email?.trim().toLowerCase() !== expectedEmail) {
    throw new CostGateError('Coder customer identity could not be verified.');
  }

  const workspaceResponse = await coderApiRequest(
    `/api/v2/workspaces/${encodeURIComponent(slot.workspace_id)}`,
    'GET',
  );
  const workspace = workspaceResponse.ok
    ? await workspaceResponse.json().catch(() => null) as CoderWorkspace | null
    : null;

  if (!workspace || workspace.id !== slot.workspace_id ||
      workspace.name !== slot.workspace_name ||
      workspace.owner_id !== coderUserId ||
      workspace.template_id !== templateId) {
    throw new CostGateError('Coder workspace ownership or template does not match this account.');
  }

  if (!workspace.owner_name) workspace.owner_name = owner.username;
  return workspace;
}
