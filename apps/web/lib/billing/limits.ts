import { createClient } from "@/lib/supabase/client";

export type SubscriptionPlan = "free" | "pro" | "team" | "enterprise";

export type UserLimits = {
  plan: SubscriptionPlan;
  storageLimit: number;
  projectsLimit: number;
  workspacesLimit: number;
  ideSessionsLimit: number;
  computeCreditsMonthly: number;
  aiTokensMonthly: number;
  runtimeHoursMonthly: number;
  apiCallsMonthly: number;
  storageUsed: number;
  computeUsed: number;
  aiTokensUsed: number;
  runtimeHoursUsed: number;
  apiCallsUsed: number;
};

export type ProjectLimits = {
  runtimeHoursLimit: number;
  runtimeHoursUsed: number;
  storageUsed: number;
};

export const PLAN_LIMITS: Record<SubscriptionPlan, Omit<UserLimits, "storageUsed" | "computeUsed" | "aiTokensUsed" | "runtimeHoursUsed" | "apiCallsUsed">> = {
  free: {
    plan: "free",
    storageLimit: 100 * 1024 * 1024, // 100 MB
    projectsLimit: 1,
    workspacesLimit: 0,
    ideSessionsLimit: 0,
    computeCreditsMonthly: 10000,
    aiTokensMonthly: 5000,
    runtimeHoursMonthly: 0,
    apiCallsMonthly: 100,
  },
  pro: {
    plan: "pro",
    storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB
    projectsLimit: 5,
    workspacesLimit: 1,
    ideSessionsLimit: 1,
    computeCreditsMonthly: 100000,
    aiTokensMonthly: 100000,
    runtimeHoursMonthly: 10,
    apiCallsMonthly: 10000,
  },
  team: {
    plan: "team",
    storageLimit: 50 * 1024 * 1024 * 1024, // 50 GB
    projectsLimit: 10,
    workspacesLimit: 5,
    ideSessionsLimit: 5,
    computeCreditsMonthly: 500000,
    aiTokensMonthly: 500000,
    runtimeHoursMonthly: 50,
    apiCallsMonthly: 100000,
  },
  enterprise: {
    plan: "enterprise",
    storageLimit: 500 * 1024 * 1024 * 1024, // 500 GB
    projectsLimit: 999999,
    workspacesLimit: 999999,
    ideSessionsLimit: 999999,
    computeCreditsMonthly: 999999999,
    aiTokensMonthly: 999999999,
    runtimeHoursMonthly: 999999,
    apiCallsMonthly: 999999999,
  },
};

export const TI_COSTS = {
  ai_chat: 10, // tokens per message
  ai_build: 500, // tokens per build
  generate_image: 200, // tokens per image
  generate_layout: 1000, // tokens per layout
  runtime_minute: 100, // credits per runtime minute
  api_call: 1, // credit per API call
  storage_mb_month: 10, // credits per MB/month
};

export async function getUserLimits(userId: string): Promise<UserLimits | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    plan: data.subscription_plan,
    storageLimit: data.storage_limit,
    projectsLimit: data.projects_limit,
    workspacesLimit: data.workspaces_limit,
    ideSessionsLimit: data.ide_sessions_limit,
    computeCreditsMonthly: data.compute_credits_monthly,
    aiTokensMonthly: data.ai_tokens_monthly,
    runtimeHoursMonthly: data.runtime_hours_monthly,
    apiCallsMonthly: data.api_calls_monthly,
    storageUsed: data.storage_used || 0,
    computeUsed: data.compute_used || 0,
    aiTokensUsed: data.ai_tokens_used || 0,
    runtimeHoursUsed: data.runtime_hours_used || 0,
    apiCallsUsed: data.api_calls_used || 0,
  };
}

export async function checkProjectLimit(userId: string, limitType: keyof UserLimits): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const supabase = createClient();
  if (!supabase) return { allowed: false, remaining: 0, limit: 0 };

  const limits = await getUserLimits(userId);
  if (!limits) return { allowed: false, remaining: 0, limit: 0 };

  switch (limitType) {
    case "projectsLimit":
      return {
        allowed: limits.projectsLimit > limits.projectsLimit - (limits.projectsUsed || 0),
        remaining: limits.projectsLimit - (limits.projectsUsed || 0),
        limit: limits.projectsLimit,
      };
    case "storageLimit":
      return {
        allowed: limits.storageLimit > limits.storageUsed,
        remaining: limits.storageLimit - limits.storageUsed,
        limit: limits.storageLimit,
      };
    case "aiTokensMonthly":
      return {
        allowed: limits.aiTokensMonthly > limits.aiTokensUsed,
        remaining: limits.aiTokensMonthly - limits.aiTokensUsed,
        limit: limits.aiTokensMonthly,
      };
    case "apiCallsMonthly":
      return {
        allowed: limits.apiCallsMonthly > limits.apiCallsUsed,
        remaining: limits.apiCallsMonthly - limits.apiCallsUsed,
        limit: limits.apiCallsMonthly,
      };
    default:
      return { allowed: true, remaining: 999999, limit: 999999 };
  }
}

export async function logUsage(
  userId: string,
  projectId: string | null,
  action: string,
  tokensUsed: number = 0,
  computeCreditsUsed: number = 0,
  runtimeMinutes: number = 0
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const costCents = Math.floor(
    (tokensUsed * 0.001 + computeCreditsUsed * 0.01 + runtimeMinutes * 0.1) * 100
  );

  await supabase.from("usage_logs").insert({
    user_id: userId,
    project_id: projectId,
    action,
    tokens_used: tokensUsed,
    compute_credits_used: computeCreditsUsed,
    runtime_minutes: runtimeMinutes,
    cost_cents: costCents,
  });
}

export async function updateUserUsage(
  userId: string,
  updates: {
    storageUsed?: number;
    aiTokensUsed?: number;
    computeUsed?: number;
    runtimeHoursUsed?: number;
    apiCallsUsed?: number;
  }
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const set: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.storageUsed !== undefined) set.storage_used = updates.storageUsed;
  if (updates.aiTokensUsed !== undefined) set.ai_tokens_used = updates.aiTokensUsed;
  if (updates.computeUsed !== undefined) set.compute_used = updates.computeUsed;
  if (updates.runtimeHoursUsed !== undefined) set.runtime_hours_used = updates.runtimeHoursUsed;
  if (updates.apiCallsUsed !== undefined) set.api_calls_used = updates.apiCallsUsed;

  await supabase.from("user_profiles").update(set).eq("id", userId);
}

export async function checkAndConsumeAITokens(
  userId: string,
  tokensNeeded: number
): Promise<{ allowed: boolean; message?: string }> {
  const limits = await getUserLimits(userId);
  if (!limits) return { allowed: false, message: "Unable to verify limits" };

  const remaining = limits.aiTokensMonthly - limits.aiTokensUsed;
  if (remaining < tokensNeeded) {
    return {
      allowed: false,
      message: `AI tokens limit reached. You have ${remaining} tokens remaining this month. Upgrade to Pro for more.`,
    };
  }

  await logUsage(userId, null, "ai_usage", tokensNeeded);
  await updateUserUsage(userId, { aiTokensUsed: limits.aiTokensUsed + tokensNeeded });

  return { allowed: true };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

type PlanTier = "free" | "pro" | "team" | "enterprise";

export const PLAN_PERMISSIONS: Record<PlanTier, string[]> = {
  free: [
    "view_projects",
    "basic_build",
    "wonderbuild_ui",
  ],
  pro: [
    "view_projects",
    "basic_build",
    "wonderbuild_ui",
    "ai_builder",
    "export_code",
    "custom_domains",
    "wonderplay_3d",
    "cloud_ide",
    "deploy",
  ],
  team: [
    "view_projects",
    "basic_build",
    "wonderbuild_ui",
    "ai_builder",
    "export_code",
    "custom_domains",
    "wonderplay_3d",
    "cloud_ide",
    "deploy",
    "team_collaboration",
    "shared_assets",
    "white_label",
    "k8s_runtimes",
  ],
  enterprise: [
    "view_projects",
    "basic_build",
    "wonderbuild_ui",
    "ai_builder",
    "export_code",
    "custom_domains",
    "wonderplay_3d",
    "cloud_ide",
    "deploy",
    "team_collaboration",
    "shared_assets",
    "white_label",
    "k8s_runtimes",
    "sso_scim",
    "private_cloud",
    "dedicated_support",
    "unlimited_everything",
  ],
};

export function checkAccess(userTier: PlanTier, feature: string): boolean {
  return PLAN_PERMISSIONS[userTier]?.includes(feature) ?? false;
}

export function getTierFeatures(userTier: PlanTier): string[] {
  return PLAN_PERMISSIONS[userTier] ?? [];
}