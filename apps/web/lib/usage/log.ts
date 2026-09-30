import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export type UsageAction =
  | "api.call"
  | "ai.token"
  | "ide.session"
  | "runtime.minute"
  | "compute.credit"
  | "storage.byte"
  | "3d.generation";

export type UsageEvent = {
  userId: string;
  action: UsageAction;
  projectId?: string | null;
  apiCalls?: number;
  tokensUsed?: number;
  computeCreditsUsed?: number;
  runtimeMinutes?: number;
  threeDGenerations?: number;
};

let serviceClient: ReturnType<typeof createClient<any>> | null = null;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!serviceClient) {
    serviceClient = createClient<any>(url, key, { auth: { persistSession: false } });
  }
  return serviceClient;
}

export async function logUsage(event: UsageEvent): Promise<void> {
  try {
    if (!event.userId || !event.action) return;
    const supabase = getServiceClient();
    if (!supabase) {
      logger.error("logUsage skipped: Supabase service env missing");
      return;
    }
    const { error } = await supabase.from("usage_logs").insert({
      user_id: event.userId,
      project_id: event.projectId ?? null,
      action: event.action,
      api_calls: event.apiCalls ?? 0,
      tokens_used: event.tokensUsed ?? 0,
      compute_credits_used: event.computeCreditsUsed ?? 0,
      runtime_minutes: event.runtimeMinutes ?? 0,
      three_d_generations: event.threeDGenerations ?? 0,
    });
    if (error) {
      logger.error("logUsage insert failed:", error.message);
      return;
    }

    // Evaluate saved billing alarms after a real usage event is recorded.
    // The evaluator is server-only and provider-gated, so missing email/SMS
    // configuration never fabricates a successful delivery.
    try {
      const { evaluateUsageAlerts } = await import("@/lib/billing/usage-alerts.server");
      await evaluateUsageAlerts(event.userId);
    } catch (alertError) {
      logger.error("usage alert evaluation failed:", alertError);
    }
  } catch (e) {
    logger.error("logUsage errored:", e);
  }
}
