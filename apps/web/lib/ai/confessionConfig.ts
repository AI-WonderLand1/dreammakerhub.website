import { logger } from '@/lib/logger';
export type ConfessionExtractionMode = "free" | "paid";

export interface ConfessionConfig {
  mode: ConfessionExtractionMode;
  enableMem0: boolean;
  extractionModel?: string;
}

export const DEFAULT_CONFESSION_CONFIG: ConfessionConfig = {
  mode: "free",
  enableMem0: false,
};

export function getConfessionConfig(
  plan: string | null,
  enableMem0?: boolean
): ConfessionConfig {
  const isPaid = plan === "pro" || plan === "team" || plan === "enterprise";

  return {
    mode: isPaid ? "paid" : "free",
    enableMem0: isPaid && Boolean(enableMem0),
    extractionModel: isPaid ? "gemini-2.5-flash" : undefined,
  };
}

export function isPaidTier(plan: string | null): boolean {
  return plan === "pro" || plan === "team" || plan === "enterprise";
}

export function shouldUseLLMExtraction(plan: string | null): boolean {
  return isPaidTier(plan);
}
