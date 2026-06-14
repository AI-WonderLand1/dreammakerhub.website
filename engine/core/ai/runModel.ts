// engine/core/ai/runModel.ts
import { Providers } from "./providers";


/**
 * Wonder-Build Model Runner
 * - Routes "github/*" to GitHub Models
 * - Routes "groq/*" to GROQ AI
 * - Routes "google/*" to Google AI
 * - Routes everything else to GitHub Models provider by default
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
  messages: Array<{ role: string; content: string | unknown[] }>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const lastContent = (messages?.[messages.length - 1]?.content ?? "") as string | unknown[];

  // Routing model

  // If your agent IDs are like "github/gpt-4o-mini" or "groq/llama-3.1-8b-instant" or "google/gemini-2.5-flash"
  const isGithub = typeof model === "string" && model.startsWith("github/");
  const isGroq = typeof model === "string" && model.startsWith("groq/");
  const isGoogle = typeof model === "string" && model.startsWith("google/");
  const isOpencode = typeof model === "string" && model.startsWith("opencode/");
  const isN8n = typeof model === "string" && model.startsWith("n8n/");

  if (isGithub) {
    // GitHub Models expects a model name that does NOT include "github/" prefix.
    const githubModel = model.replace(/^github\//, "");

    return Providers.github.generate(lastContent, {
      model: githubModel,
      system,
      temperature,
      maxTokens,
    });
  }

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

  if (isOpencode) {
    // OpenCode provider - use as default when no prefix specified
    const opencodeModel = model.replace(/^opencode\//, "");

    return Providers.opencode.generate(lastContent, {
      model: opencodeModel || "opencode/big-pickle",
      system,
      temperature,
      maxTokens,
    });
  }

  if (isN8n) {
    // n8n classification webhook
    return Providers.n8n.generate(lastContent, {
      system,
      temperature,
      maxTokens,
    });
  }

  // Default: OpenCode provider for high-quality inference
  return Providers.opencode.generate(lastContent, {
    model,
    system,
    temperature,
    maxTokens,
  });
}
