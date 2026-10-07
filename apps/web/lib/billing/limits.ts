export type SubscriptionPlan = "free" | "creator" | "pro" | "studio" | "team" | "enterprise";

export type UserLimits = {
  plan: SubscriptionPlan;
  storageLimit: number;
  projectsLimit: number;
  workspacesLimit: number;
  ideSessionsLimit: number;
  /** Concurrent/saved IDE budget. Micro costs 10 credits; Standard costs 20. */
  workspaceQuotaCredits: number;
  computeCreditsMonthly: number;
  /**
   * Legacy internal name. These units are customer-facing AI credits, not raw
   * provider tokens. The database feature key remains ai_tokens for backwards
   * compatibility while cross-repo metering is migrated.
   */
  aiTokensMonthly: number;
  renderCreditsMonthly: number;
  runtimeHoursMonthly: number;
  apiCallsMonthly: number;
  storageUsed: number;
  computeUsed: number;
  aiTokensUsed: number;
  renderCreditsUsed?: number;
  runtimeHoursUsed: number;
  apiCallsUsed: number;
};

export type ProjectLimits = {
  runtimeHoursLimit: number;
  runtimeHoursUsed: number;
  storageUsed: number;
};

export const PLAN_LIMITS: Record<SubscriptionPlan, Omit<UserLimits, "storageUsed" | "computeUsed" | "aiTokensUsed" | "renderCreditsUsed" | "runtimeHoursUsed" | "apiCallsUsed">> = {
  free: {
    plan: "free",
    storageLimit: 5 * 1024 * 1024 * 1024,
    projectsLimit: 5,
    workspacesLimit: 5,
    ideSessionsLimit: 2,
    workspaceQuotaCredits: 20,
    computeCreditsMonthly: 9000,
    aiTokensMonthly: 500000,
    renderCreditsMonthly: 10,
    runtimeHoursMonthly: 150,
    apiCallsMonthly: 10000,
  },
  creator: {
    plan: "creator",
    storageLimit: 25 * 1024 * 1024 * 1024,
    projectsLimit: 25,
    workspacesLimit: 25,
    ideSessionsLimit: 2,
    workspaceQuotaCredits: 20,
    computeCreditsMonthly: 12000,
    aiTokensMonthly: 2000000,
    renderCreditsMonthly: 50,
    runtimeHoursMonthly: 200,
    apiCallsMonthly: 25000,
  },
  pro: {
    plan: "pro",
    storageLimit: 100 * 1024 * 1024 * 1024,
    projectsLimit: 100,
    workspacesLimit: 100,
    ideSessionsLimit: 4,
    workspaceQuotaCredits: 40,
    computeCreditsMonthly: 18000,
    aiTokensMonthly: 5000000,
    renderCreditsMonthly: 150,
    runtimeHoursMonthly: 300,
    apiCallsMonthly: 100000,
  },
  studio: {
    plan: "studio",
    storageLimit: 250 * 1024 * 1024 * 1024,
    projectsLimit: 250,
    workspacesLimit: 250,
    ideSessionsLimit: 6,
    workspaceQuotaCredits: 60,
    computeCreditsMonthly: 30000,
    aiTokensMonthly: 12000000,
    renderCreditsMonthly: 400,
    runtimeHoursMonthly: 500,
    apiCallsMonthly: 250000,
  },
  team: {
    plan: "team",
    storageLimit: 500 * 1024 * 1024 * 1024,
    projectsLimit: 999999,
    workspacesLimit: 999999,
    ideSessionsLimit: 8,
    workspaceQuotaCredits: 80,
    computeCreditsMonthly: 60000,
    aiTokensMonthly: 25000000,
    renderCreditsMonthly: 1000,
    runtimeHoursMonthly: 1000,
    apiCallsMonthly: 1000000,
  },
  enterprise: {
    plan: "enterprise",
    storageLimit: 500 * 1024 * 1024 * 1024,
    projectsLimit: 999999,
    workspacesLimit: 999999,
    ideSessionsLimit: 999999,
    workspaceQuotaCredits: 9999990,
    computeCreditsMonthly: 999999999,
    aiTokensMonthly: 999999999,
    renderCreditsMonthly: 999999999,
    runtimeHoursMonthly: 999999,
    apiCallsMonthly: 999999999,
  },
};

export const TI_COSTS = {
  ai_chat: 10,
  ai_build: 500,
  generate_image: 200,
  generate_layout: 1000,
  runtime_minute: 100,
  api_call: 1,
  storage_mb_month: 10,
};

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

export const PLAN_PERMISSIONS: Record<SubscriptionPlan, string[]> = {
  free: ["view_projects", "basic_build", "wonderbuild_ui", "ai_builder", "cloud_ide"],
  creator: ["view_projects", "basic_build", "wonderbuild_ui", "ai_builder", "export_code", "npc_ai_sim", "cloud_ide"],
  pro: ["view_projects", "basic_build", "wonderbuild_ui", "ai_builder", "export_code", "custom_domains", "npc_ai_sim", "cloud_ide", "deploy"],
  studio: ["view_projects", "basic_build", "wonderbuild_ui", "ai_builder", "export_code", "custom_domains", "npc_ai_sim", "cloud_ide", "deploy"],
  team: ["view_projects", "basic_build", "wonderbuild_ui", "ai_builder", "export_code", "custom_domains", "npc_ai_sim", "cloud_ide", "deploy", "team_collaboration", "shared_assets", "white_label", "k8s_runtimes"],
  enterprise: ["view_projects", "basic_build", "wonderbuild_ui", "ai_builder", "export_code", "custom_domains", "npc_ai_sim", "cloud_ide", "deploy", "team_collaboration", "shared_assets", "white_label", "k8s_runtimes", "sso_scim", "private_cloud", "dedicated_support", "unlimited_everything"],
};

export function checkAccess(userTier: SubscriptionPlan, feature: string): boolean {
  return PLAN_PERMISSIONS[userTier]?.includes(feature) ?? false;
}

export function getTierFeatures(userTier: SubscriptionPlan): string[] {
  return PLAN_PERMISSIONS[userTier] ?? [];
}
