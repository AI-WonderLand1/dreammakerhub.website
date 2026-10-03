import 'server-only';
import { getClient } from '@/lib/supabase-service';
import { PLAN_LIMITS, type SubscriptionPlan } from '@/lib/billing/limits';
import { normalizeAiCredits, type AiCostClass } from '@/lib/billing/ai-credit-policy';

type BillableFeature = 'ai_tokens' | 'ai_requests' | 'agent_requests' | 'workspace_launches' | 'render_credits';
type UsageSource = 'dreammakerhub' | 'ai-playground' | 'npc-ai-sim';

export class CostGateError extends Error {
  constructor(message: string, public readonly status: 402 | 429 | 503 = 503) {
    super(message);
    this.name = 'CostGateError';
  }
}

function serviceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new CostGateError('Billing verification is not configured. Paid operations are paused.');
  }
  return getClient();
}

/** Only Stripe-verified active/trialing subscriptions unlock paid plan allowances. */
export async function verifiedCostPlan(userId: string): Promise<SubscriptionPlan> {
  const client = serviceClient();
  const { data, error } = await client.from('subscriptions')
    .select('plan,status,stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .limit(10);
  if (error) throw new CostGateError('Subscription verification is unavailable. Paid operations are paused.');

  const verified = (data ?? []).filter((subscription) =>
    typeof subscription.stripe_subscription_id === 'string' &&
    subscription.stripe_subscription_id.startsWith('sub_') &&
    (subscription.status === 'active' || subscription.status === 'trialing'));

  const precedence: SubscriptionPlan[] = ['enterprise', 'team', 'studio', 'pro', 'creator'];
  for (const plan of precedence) {
    if (verified.some((subscription) => subscription.plan === plan)) return plan;
  }
  return 'free';
}

/** Charge the allowance before contacting providers. Reservations are never refunded automatically. */
export async function reserveBillableUnits(
  userId: string,
  feature: BillableFeature,
  units: number,
  limit: number,
  source: UsageSource = 'dreammakerhub',
): Promise<void> {
  if (process.env.BILLABLE_OPERATIONS_ENABLED !== 'true') {
    throw new CostGateError('Paid operations are paused until billing safeguards are activated.');
  }
  if (!Number.isSafeInteger(units) || units <= 0 || !Number.isSafeInteger(limit) || limit < 0) {
    throw new CostGateError('Invalid usage limit. Operation blocked.');
  }
  const client = serviceClient();
  const { data, error } = await client.rpc('reserve_billable_units_v2', {
    p_user_id: userId,
    p_feature: feature,
    p_units: units,
    p_limit: limit,
    p_source: source,
  });
  if (error || typeof data !== 'boolean') {
    throw new CostGateError('Usage accounting is unavailable. Paid operations are paused.');
  }
  if (!data) {
    const message = feature === 'render_credits'
      ? 'Not enough 3D credits.'
      : feature === 'ai_tokens'
        ? 'AI credit allowance and purchased balance are exhausted.'
        : 'Monthly usage limit reached.';
    throw new CostGateError(message, 429);
  }
}

export async function reserveAiRequest(
  userId: string,
  inputCharacters: number,
  outputTokens: number,
  costClass: AiCostClass = 'standard',
) {
  const plan = await verifiedCostPlan(userId);
  if (!Number.isSafeInteger(inputCharacters) || inputCharacters < 1 || inputCharacters > 12000 ||
      !Number.isSafeInteger(outputTokens) || outputTokens < 1 || outputTokens > 4096) {
    throw new CostGateError('AI input or output exceeds the per-request budget.', 429);
  }

  const limits = PLAN_LIMITS[plan];
  const estimatedTokens = Math.ceil(inputCharacters / 2) + outputTokens;
  const estimatedCredits = normalizeAiCredits(estimatedTokens, costClass);

  if (estimatedCredits > 0) {
    await reserveBillableUnits(userId, 'ai_tokens', estimatedCredits, limits.aiTokensMonthly);
  }
  await reserveBillableUnits(userId, 'ai_requests', 1, limits.apiCallsMonthly);
  return { plan, estimatedTokens, estimatedCredits, costClass };
}

export async function reserveAgentRequest(userId: string, inputCharacters: number) {
  const plan = await verifiedCostPlan(userId);
  if (!Number.isSafeInteger(inputCharacters) || inputCharacters < 1 || inputCharacters > 5000) {
    throw new CostGateError('Agent input exceeds the per-request budget.', 429);
  }
  const limits = PLAN_LIMITS[plan];
  const requestLimits: Record<SubscriptionPlan, number> = {
    free: 100,
    creator: 500,
    pro: 2000,
    studio: 5000,
    team: 10000,
    enterprise: 100000,
  };
  const estimatedCredits = normalizeAiCredits(Math.ceil(inputCharacters / 2) + 4096, 'standard');
  await reserveBillableUnits(userId, 'ai_tokens', estimatedCredits, limits.aiTokensMonthly);
  await reserveBillableUnits(userId, 'agent_requests', 1, requestLimits[plan]);
  return plan;
}

export async function reserveWorkspaceLaunch(userId: string) {
  const plan = await verifiedCostPlan(userId);
  if (process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('New cloud workspaces are paused until the workspace safety controls are verified.');
  }
  if (PLAN_LIMITS[plan].workspacesLimit < 1) {
    throw new CostGateError('Your plan does not include a cloud workspace.', 402);
  }
  return plan;
}

export function costGateResponse(error: unknown) {
  const gate = error instanceof CostGateError
    ? error
    : new CostGateError('Unable to verify billing limits. Operation blocked.');
  return Response.json({ error: gate.message, code: 'COST_GUARD' }, { status: gate.status });
}
