// engine/core/ai/runModel.ts
import { Providers } from "./providers";


/**
 * Wonder-Build Model Runner
 * - Routes "github/*" to GitHub Models
 * - Routes "groq/*" to GROQ AI
 * - Routes "google/*" to Google AI
<<<<<<< HEAD
 * - Routes everything else to GitHub Models provider by default
 * - Supports multimodal prompt content (arrays/objects)
=======
 * - Routes "opencode/*" to OpenCode
 * - Routes "openrouter/*" to OpenRouter
 * - Supports user-provided API keys via userApiKey option
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
 */
export async function runModel({
  model,
  messages,
  system,
  temperature = 0.7,
  maxTokens = 4096,
  userApiKey,
}: {
  model: string;
<<<<<<< HEAD
  messages: Array<{ role: string; content: string | unknown[] }>;
=======
  messages: Array<{ role: string; content: string | unknown[]; }>;
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
  system?: string;
  temperature?: number;
  maxTokens?: number;
  userApiKey?: string;
}) {
  const lastContent = (messages?.[messages.length - 1]?.content ?? "") as string | unknown[];

  // Routing model

  // If your agent IDs are like "github/gpt-4o-mini" or "groq/llama-3.1-8b-instant" or "google/gemini-2.5-flash"
  const isGithub = typeof model === "string" && model.startsWith("github/");
  const isGroq = typeof model === "string" && model.startsWith("groq/");
  const isGoogle = typeof model === "string" && model.startsWith("google/");
  const isOpencode = typeof model === "string" && model.startsWith("opencode/");
<<<<<<< HEAD

  if (isGithub) {
    // GitHub Models expects a model name that does NOT include "github/" prefix.
    const githubModel = model.replace(/^github\//, "");

    return Providers.github.generate(lastContent, {
      model: githubModel,
=======
  const isOpenrouter = typeof model === "string" && model.startsWith("openrouter/");
  const isN8n = typeof model === "string" && model.startsWith("n8n/");

  if (isGithub) {
    const githubModel = model.replace(/^github\//, "");
    return Providers.github.generate(lastContent, {
      model: githubModel,
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isGroq) {
    const groqModel = model.replace(/^groq\//, "");
    return Providers.groq.generate(lastContent, {
      model: groqModel,
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isGoogle) {
    const googleModel = model.replace(/^google\//, "");
    return Providers.google.generate(lastContent, {
      model: googleModel,
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isOpenrouter) {
    const openrouterModel = model.replace(/^openrouter\//, "");
    return Providers.openrouter.generate(lastContent, {
      model: openrouterModel || "google/gemini-flash-1.5",
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isOpencode) {
    const opencodeModel = model.replace(/^opencode\//, "");
    return Providers.opencode.generate(lastContent, {
      model: opencodeModel || "opencode/big-pickle",
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isN8n) {
    return Providers.n8n.generate(lastContent, {
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
      system,
      temperature,
      maxTokens,
    });
  }

<<<<<<< HEAD
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

  // Default: OpenCode provider for high-quality inference
  return Providers.opencode.generate(lastContent, {
    model,
=======
  // Default: GROQ provider for fast inference
  return Providers.groq.generate(lastContent, {
    model: model || "llama-3.1-8b-instant",
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
    system,
    temperature,
    maxTokens,
    apiKey: userApiKey,
  });
}
