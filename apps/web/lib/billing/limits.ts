
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
    storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB included
    projectsLimit: 5,
    workspacesLimit: 5,
    ideSessionsLimit: 2,
    computeCreditsMonthly: 9000,
    aiTokensMonthly: 500000,
    runtimeHoursMonthly: 150,
    apiCallsMonthly: 10000,
  },
  pro: {
    plan: "pro",
    storageLimit: 100 * 1024 * 1024 * 1024, // 100 GB included
    projectsLimit: 100,
    workspacesLimit: 100,
    ideSessionsLimit: 4,
    computeCreditsMonthly: 18000,
    aiTokensMonthly: 5000000,
    runtimeHoursMonthly: 300,
    apiCallsMonthly: 100000,
  },
  team: {
    plan: "team",
    storageLimit: 500 * 1024 * 1024 * 1024, // 500 GB pooled
    projectsLimit: 999999,
    workspacesLimit: 999999,
    ideSessionsLimit: 8,
    computeCreditsMonthly: 60000,
    aiTokensMonthly: 25000000,
    runtimeHoursMonthly: 1000,
    apiCallsMonthly: 1000000,
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

/**
 * Authoritative usage and entitlement checks are server-side only.
 * See cost-guard.server.ts and reserve_billable_units_v2.
 * This module intentionally contains plan constants and presentation helpers only.
 */
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
    "ai_builder",
    "cloud_ide",
  ],
  pro: [
    "view_projects",
    "basic_build",
    "wonderbuild_ui",
    "ai_builder",
    "export_code",
    "custom_domains",
    "npc_ai_sim",
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
    "npc_ai_sim",
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
    "npc_ai_sim",
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