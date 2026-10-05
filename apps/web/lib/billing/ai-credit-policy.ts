export type AiCostClass = "standard" | "enhanced" | "premium" | "frontier" | "byok";

export const AI_CREDIT_POLICY_VERSION = "2026-10-03";

export const AI_CREDIT_MULTIPLIERS: Record<AiCostClass, number> = {
  standard: 1,
  enhanced: 2,
  premium: 4,
  frontier: 8,
  byok: 0,
};

export function parseAiCostClass(value: unknown): AiCostClass {
  return value === "enhanced" || value === "premium" || value === "frontier" || value === "byok"
    ? value
    : "standard";
}

export function normalizeAiCredits(rawTokenEquivalent: number, costClass: AiCostClass): number {
  if (!Number.isSafeInteger(rawTokenEquivalent) || rawTokenEquivalent < 0) {
    throw new Error("Invalid AI usage units");
  }
  return rawTokenEquivalent * AI_CREDIT_MULTIPLIERS[costClass];
}

/**
 * Builders intentionally use one configured route today.
 * These modes are the future customer-facing abstraction and must not be shown
 * as selectable until BUILDER_MODE_SELECTION_ENABLED becomes true.
 */
export const BUILDER_MODE_SELECTION_ENABLED = false;
export const BUILDER_AI_MODES = {
  fast: { label: "Fast", costClass: "standard" as const, status: "planned" as const },
  balanced: { label: "Balanced", costClass: "enhanced" as const, status: "planned" as const },
  advanced: { label: "Advanced", costClass: "premium" as const, status: "planned" as const },
};
