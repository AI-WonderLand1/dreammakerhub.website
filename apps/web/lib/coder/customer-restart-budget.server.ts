import 'server-only';
import { CostGateError } from '@/lib/billing/cost-guard.server';
import { coderServiceClient } from '@/lib/coder/workspace-slots.server';

/**
 * Fail closed before any customer-initiated IDE restart.
 * This is only a restart gate: the runtime metering/stop controller must be
 * enabled separately before usage-based billing or bonus hours can launch.
 */
export async function assertCustomerIdeRestartBudget(userId: string, workspaceId: string): Promise<void> {
  const db = coderServiceClient();
  const { data: usage, error: usageError } = await db
    .from('coder_customer_compute_usage')
    .select('used_ms,max_ms')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (usageError || !usage ||
    typeof usage.used_ms !== 'number' || typeof usage.max_ms !== 'number' ||
    usage.max_ms <= 0) {
    throw new CostGateError('IDE runtime allowance cannot be verified. Workspace restart is paused.');
  }
  if (usage.used_ms >= usage.max_ms) {
    throw new CostGateError('IDE runtime allowance exhausted. Workspace restart is paused.', 429);
  }

  const now = new Date();
  const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const { data: monthly, error: monthlyError } = await db
    .from('coder_customer_compute_monthly')
    .select('used_weighted_ms,limit_credits')
    .eq('user_id', userId)
    .eq('period_start', periodStart)
    .maybeSingle();
  if (monthlyError || !monthly ||
    typeof monthly.used_weighted_ms !== 'number' ||
    typeof monthly.limit_credits !== 'number' ||
    monthly.limit_credits <= 0) {
    throw new CostGateError('Monthly IDE budget cannot be verified. Workspace restart is paused.');
  }
  if (monthly.used_weighted_ms >= monthly.limit_credits * 60_000) {
    throw new CostGateError('Monthly IDE compute allowance exhausted. Workspace restart is paused.', 429);
  }
}
