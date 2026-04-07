// engine/core/ai/runModel.ts
import { Providers } from "./providers";

/**
 * Wonder-Build Model Runner
 * - Routes "groq/*" to GROQ AI
 * - Routes "google/*" to Google AI
 * - Routes everything else to GROQ provider by default
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

  // If your agent IDs are like "groq/llama3-8b-8192" or "google/gemini-2.5-flash"
  const isGroq = typeof model === "string" && model.startsWith("groq/");
  const isGoogle = typeof model === "string" && model.startsWith("google/");

  if (isGroq) {
    // GROQ expects a model name that does NOT include "groq/" prefix.
    const groqModel = model.replace(/^groq\//, "");

    return Providers.groq.generate(lastContent, {
      model: groqModel,
      system,
      temperature,
      maxTokens,
    });
  }

  if (isGoogle) {
    // Google AI expects a model name that does NOT include "google/" prefix.
    const googleModel = model.replace(/^google\//, "");

    return Providers.google.generate(lastContent, {
      model: googleModel,
      system,
      temperature,
      maxTokens,
    });
  }

  // Default: GROQ provider for fast inference
  return Providers.groq.generate(lastContent, {
    model,
    system,
    temperature,
    maxTokens,
  });
}
