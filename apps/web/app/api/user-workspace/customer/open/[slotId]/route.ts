import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse, verifiedCostPlan } from '@/lib/billing/cost-guard.server';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import {
  coderApiConfig,
  coderApiRequest,
  coderServiceClient,
  getCoderSlot,
} from '@/lib/coder/workspace-slots.server';
import {
  assertFreshUsageController,
  customerProvisioningGate,
  verifiedCustomerTemplateId,
} from '@/lib/coder/customer-provisioning.server';
import { verifiedCustomerCoderOwner } from '@/lib/coder/customer-identity.server';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slotId: string }> };
type CoderUser = {
  id?: string;
  username?: string;
  email?: string;
  login_type?: string;
  status?: string;
  is_service_account?: boolean;
};
type CoderWorkspace = {
  id?: string;
  name?: string;
  owner_id?: string;
  owner_name?: string;
  template_id?: string;
  status?: string;
  latest_build?: { status?: string; transition?: string };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
};

function publicCoderOrigin(): string {
  const configured = process.env.CODER_ACCESS_URL;
  if (!configured) throw new CostGateError('The public Coder address is not configured.');
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new CostGateError('The public Coder address is invalid.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      (url.pathname !== '/' && url.pathname !== '')) {
    throw new CostGateError('The public Coder address must be an HTTPS origin.');
  }
  return url.origin;
}

function workspaceState(workspace: CoderWorkspace): string {
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

async function assertRestartBudget(userId: string, slotId: string): Promise<void> {
  const db = coderServiceClient();
  const usage = await db.from('coder_customer_compute_usage')
    .select('used_ms,max_ms')
    .eq('slot_id', slotId)
    .eq('user_id', userId)
    .maybeSingle();

  if (usage.error || !usage.data ||
      !Number.isFinite(Number(usage.data.used_ms)) ||
      !Number.isFinite(Number(usage.data.max_ms))) {
    throw new CostGateError('Workspace compute allowance could not be verified.');
  }
  if (Number(usage.data.used_ms) >= Number(usage.data.max_ms)) {
    throw new CostGateError('This workspace has reached its compute allowance.', 402);
  }

  const plan = await verifiedCostPlan(userId);
  const monthlyLimit = PLAN_LIMITS[plan].computeCreditsMonthly;
  if (!Number.isSafeInteger(monthlyLimit) || monthlyLimit < 1) {
    throw new CostGateError('Monthly workspace compute allowance is not configured.');
  }

  const now = new Date();
  const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const monthly = await db.from('coder_customer_compute_monthly')
    .select('used_weighted_ms')
    .eq('user_id', userId)
    .eq('period_start', periodStart)
    .maybeSingle();

  if (monthly.error) {
    throw new CostGateError('Monthly workspace usage could not be verified.');
  }
  const usedCredits = monthly.data
    ? Math.ceil(Number(monthly.data.used_weighted_ms || 0) / 60_000)
    : 0;
  if (!Number.isFinite(usedCredits) || usedCredits >= monthlyLimit) {
    throw new CostGateError('Your monthly workspace compute allowance has been reached.', 402);
  }
}

async function verifiedCustomerWorkspace(
  request: Request,
  slotId: string,
): Promise<{ workspace: CoderWorkspace; owner: CoderUser }> {
  const user = await authenticatedSupabaseUser(request);
  if (!user) throw new CostGateError('Unauthorized', 401);

  customerProvisioningGate();
  const templateId = await verifiedCustomerTemplateId();
  await assertFreshUsageController();

  const slot = await getCoderSlot(user.id, slotId);
  if (!slot || slot.state !== 'provisioned' || !slot.workspace_id || !UUID.test(slot.workspace_id)) {
    throw new CostGateError('Workspace is not ready yet.', 409);
  }
  if (slot.coder_api_origin !== coderApiConfig().url) {
    throw new CostGateError('This workspace belongs to a different Coder deployment. Contact support.');
  }

  const coderUserId = await verifiedCustomerCoderOwner(user);
  const operatorId = process.env.CODER_OPERATOR_USER_ID;
  if (!operatorId || !UUID.test(operatorId) || coderUserId === operatorId) {
    throw new CostGateError('Customer and operator Coder identities are not safely separated.');
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
      owner.login_type !== 'oidc' || owner.status !== 'active' ||
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

  return { workspace, owner };
}

async function handle(request: Request, { params }: Context, start: boolean) {
  const { slotId } = await params;
  if (!UUID.test(slotId)) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: noStore });
  }

  try {
    const user = await authenticatedSupabaseUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
    }

    const { workspace, owner } = await verifiedCustomerWorkspace(request, slotId);
    const state = workspaceState(workspace);

    if (state === 'running') {
      const url =
        `${publicCoderOrigin()}/@${encodeURIComponent(owner.username!)}/${encodeURIComponent(workspace.name!)}/apps/code-server/`;
      return NextResponse.json(
        { status: 'running', url, workspaceId: workspace.id },
        { headers: noStore },
      );
    }

    if (['pending', 'starting', 'stopping', 'deleting', 'canceling'].includes(state)) {
      return NextResponse.json(
        { status: state, message: 'Coder is finishing a workspace transition.' },
        { status: 202, headers: noStore },
      );
    }

    if (state !== 'stopped') {
      return NextResponse.json(
        { error: `Coder reports workspace state ${state}.` },
        { status: 409, headers: noStore },
      );
    }

    if (!start) {
      return NextResponse.json({ status: 'stopped' }, { headers: noStore });
    }

    await assertRestartBudget(user.id, slotId);

    const started = await coderApiRequest(
      `/api/v2/workspaces/${encodeURIComponent(workspace.id!)}/builds`,
      'POST',
      { transition: 'start' },
    );
    if (!started.ok && started.status !== 409) {
      throw new CostGateError('Coder did not accept the workspace restart.');
    }

    return NextResponse.json(
      { status: 'starting', message: 'Starting your existing private workspace.' },
      { status: 202, headers: noStore },
    );
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}

export async function GET(request: Request, context: Context) {
  return handle(request, context, false);
}

export async function POST(request: Request, context: Context) {
  return handle(request, context, true);
}
