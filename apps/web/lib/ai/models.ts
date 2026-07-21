import { logger } from '@/lib/logger';
export const FREE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-8b",
] as const;

export const PAID_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-pro-002",
] as const;

export const VISION_MODELS = {
  free: ["gemini-2.5-flash"],
  paid: [
    "gemini-2.5-pro",
    "gemini-2.5-pro-002",
  ],
} as const;

export const CODE_MODELS = {
  free: ["gemini-2.5-flash"],
  paid: [
    "gemini-2.5-pro",
    "gemini-2.5-pro-002",
  ],
} as const;

export interface ModelTier {
  isPaid: boolean;
  models: readonly string[];
  visionModels: readonly string[];
  codeModels: readonly string[];
}

export function getModelTier(isPaid: boolean): ModelTier {
  return {
    isPaid,
    models: isPaid ? PAID_MODELS : FREE_MODELS,
    visionModels: isPaid ? VISION_MODELS.paid : VISION_MODELS.free,
    codeModels: isPaid ? CODE_MODELS.paid : CODE_MODELS.free,
  };
}

export function getDefaultModel(isPaid: boolean): string {
  return isPaid ? PAID_MODELS[0] : FREE_MODELS[0];
}

export function selectModelForTask(
  task: "general" | "code" | "vision" | "build",
  isPaid: boolean
): string {
  const tier = getModelTier(isPaid);

  switch (task) {
    case "code":
      return tier.codeModels[0];
    case "vision":
      return tier.visionModels[0];
    case "build":
      return isPaid ? "gemini-2.5-pro" : "gemini-2.5-flash";
    default:
      return tier.models[0];
  }
}
