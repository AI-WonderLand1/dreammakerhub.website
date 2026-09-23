import 'server-only';
import { getClient } from '@/lib/supabase-service';
import { PLAN_LIMITS, type SubscriptionPlan } from '@/lib/billing/limits';

type BillableFeature = 'ai_tokens' | 'ai_requests' | 'agent_requests' | 'workspace_launches';

export class CostGateError extends Error {
  constructor(message: string, public readonly status: 402 | 429 | 503 = 503) {
    super(message);
    this.name = 'CostGateError';
  }
}

function serviceClient() {
  // getClient() has local placeholder fallbacks. A cost gate must never use them.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new CostGateError('Billing verification is not configured. Paid operations are paused.');
  }
  return getClient();
}

/** Only verified Stripe-backed, active subscriptions unlock platform-funded paid features. */
export async function verifiedCostPlan(userId: string): Promise<SubscriptionPlan> {
  const client = serviceClient();
  const { data, error } = await client.from('subscriptions')
    .select('plan,status,stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .limit(10);
  if (error) throw new CostGateError('Subscription verification is unavailable. Paid operations are paused.');
  // Enterprise is negotiated separately; a client-provided plan or profile value does not unlock it.
  const verified = (data ?? []).filter((subscription) =>
    typeof subscription.stripe_subscription_id === 'string' &&
    subscription.stripe_subscription_id.startsWith('sub_') &&
    (subscription.status === 'active' || subscription.status === 'trialing'));
  if (verified.some((subscription) => subscription.plan === 'team')) return 'team';
  if (verified.some((subscription) => subscription.plan === 'pro')) return 'pro';
  return 'free';
}

/** Charge the allowance *before* contacting providers. Reservations are never refunded automatically. */
export async function reserveBillableUnits(
  userId: string,
  feature: BillableFeature,
  units: number,
  limit: number,
): Promise<void> {
  if (process.env.BILLABLE_OPERATIONS_ENABLED !== 'true') {
    throw new CostGateError('Paid operations are paused until billing safeguards are activated.');
  }
  if (!Number.isSafeInteger(units) || units <= 0 || !Number.isSafeInteger(limit) || limit < 0) {
    throw new CostGateError('Invalid usage limit. Operation blocked.');
  }
  const client = serviceClient();
  const { data, error } = await client.rpc('reserve_billable_units', {
    p_user_id: userId,
    p_feature: feature,
    p_units: units,
    p_limit: limit,
  });
  // A missing migration, DB timeout, or permission error must NOT become unlimited usage.
  if (error || typeof data !== 'boolean') {
    throw new CostGateError('Usage accounting is unavailable. Paid operations are paused.');
  }
  if (!data) throw new CostGateError('Monthly usage limit reached.', 429);
}

export async function reserveAiRequest(userId: string, inputCharacters: number, outputTokens: number) {
  const plan = await verifiedCostPlan(userId);
  if (!Number.isSafeInteger(inputCharacters) || inputCharacters < 1 || inputCharacters > 12000 ||
      !Number.isSafeInteger(outputTokens) || outputTokens < 1 || outputTokens > 4096) {
    throw new CostGateError('AI input or output exceeds the per-request budget.', 429);
  }
  const limits = PLAN_LIMITS[plan];
  // Reserve conservatively before spending. Fallbacks/multiple model calls require their own reservations.
  const estimatedTokens = Math.ceil(inputCharacters / 2) + outputTokens;
  await reserveBillableUnits(userId, 'ai_tokens', estimatedTokens, limits.aiTokensMonthly);
  await reserveBillableUnits(userId, 'ai_requests', 1, limits.apiCallsMonthly);
  return { plan, estimatedTokens };
}

export async function reserveAgentRequest(userId: string, inputCharacters: number) {
  const plan = await verifiedCostPlan(userId);
  if (!Number.isSafeInteger(inputCharacters) || inputCharacters < 1 || inputCharacters > 5000) {
    throw new CostGateError('Agent input exceeds the per-request budget.', 429);
  }
  const limits = PLAN_LIMITS[plan];
  // Keep AI available on Free, but give paid tiers substantially larger agent pools.
  const requestLimit = plan === 'free' ? 100 : plan === 'pro' ? 2000 : plan === 'team' ? 10000 : 100000;
  // An agent request may make more than one model call: debit a fixed, conservative allowance.
  await reserveBillableUnits(userId, 'ai_tokens', Math.ceil(inputCharacters / 2) + 4096, limits.aiTokensMonthly);
  await reserveBillableUnits(userId, 'agent_requests', 1, requestLimit);
  return plan;
}

export async function reserveWorkspaceLaunch(userId: string) {
  const plan = await verifiedCostPlan(userId);
  if (process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('New cloud workspaces are paused until the pod cost controls are verified.');
  }
  if (PLAN_LIMITS[plan].workspacesLimit < 1) {
    throw new CostGateError('Your plan does not include a cloud workspace.', 402);
  }
  // Workspace creation itself is not the primary billable unit. Saved-workspace,
  // concurrent-run, compute, storage and AI limits are enforced separately.
  return plan;
}

export function costGateResponse(error: unknown) {
  const gate = error instanceof CostGateError
    ? error
    : new CostGateError('Unable to verify billing limits. Operation blocked.');
  return Response.json({ error: gate.message, code: 'COST_GUARD' }, { status: gate.status });
}
