// engine/core/ai/runModel.ts
import { Providers } from "./providers";

/**
 * Wonder-Build Model Runner
 * - Routes "openrouter/*" to OpenRouter
 * - Routes everything else (Gemini) to Google provider by default
 * - Supports multimodal prompt content (arrays/objects)
 */
export async function runModel({
  model,
  messages,
  system,
  temperature = 0.7,
  maxTokens = 4096,
}: {
  model: string;
  messages: Array<{ role: string; content: any }>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const lastContent = messages?.[messages.length - 1]?.content;

  console.log(`🤖 Wonder-Build Engine: Routing to ${model}`);

  // If your agent IDs are like "openrouter/auto" or "openrouter/google/gemini-2.0-flash-001"
  const isOpenRouter = typeof model === "string" && model.startsWith("openrouter/");

  if (isOpenRouter) {
    // OpenRouter expects a model name that does NOT include "openrouter/" in most setups.
    // If your openrouter provider expects the full string, remove the replace line.
    const openrouterModel = model.replace(/^openrouter\//, "");

    return Providers.openrouter.generate(lastContent, {
      model: openrouterModel,
      system,
      temperature,
      maxTokens,
    });
  }

  // Default: Google Gemini provider
  // Your google provider ignores "model" but we pass it anyway for consistency/future use.
  return Providers.google.generate(lastContent, {
    model,
    system,
    temperature,
    maxTokens,
  });
}
