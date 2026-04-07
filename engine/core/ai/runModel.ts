// engine/core/ai/runModel.ts
import { Providers } from "./providers";

/**
 * Wonder-Build Model Runner
 * - Routes "google/*" to Google AI
 * - Routes everything else to Google provider by default
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

  // If your agent IDs are like "google/gemini-2.5-flash" or "google/gemini-2.5-pro"
  const isGoogle = typeof model === "string" && model.startsWith("google/");

  if (isGoogle) {
    // Google AI expects a model name that does NOT include "google/" prefix.
    const googleModel = model.replace(/^google\//, "");

    return Providers.openrouter.generate(lastContent, {
      model: googleModel,
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
