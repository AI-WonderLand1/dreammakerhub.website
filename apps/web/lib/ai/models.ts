export const FREE_MODELS = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3.6-plus:free",
  "openai/gpt-oss-20b:free",
  "minimax/minimax-m2.5:free",
] as const;

export const PAID_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-2.5-pro",
  "anthropic/claude-3-opus",
  "meta-ai/llama-4-scout",
  "mistralai/mistral-nemo",
] as const;

export const VISION_MODELS = {
  free: ["google/gemini-2.0-flash-001"],
  paid: [
    "google/gemini-2.0-flash-thinking",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
  ],
} as const;

export const CODE_MODELS = {
  free: ["qwen/qwen3.6-plus:free"],
  paid: [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "google/gemini-2.5-pro",
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
      return isPaid ? "google/gemini-2.5-pro" : "google/gemini-2.0-flash-001";
    default:
      return tier.models[0];
  }
}
