// engine/core/ai/runModel.ts
import { Providers } from "./providers";


/**
 * Wonder-Build Model Runner
 * - Routes "github/*" to GitHub Models
 * - Routes "groq/*" to GROQ AI
 * - Routes "google/*" to Google AI
 * - Routes "opencode/*" to OpenCode
 * - Routes "openrouter/*" to OpenRouter
 * - Supports user-provided API keys via userApiKey option
 */
export async function runModel({
  model,
  messages,
  system,
  temperature = 0.7,
  maxTokens = 4096,
  userApiKey,
  baseUrl,
}: {
  model: string;
  messages: Array<{ role: string; content: string | unknown[]; }>;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  userApiKey?: string;
  baseUrl?: string;
}) {
  const lastContent = (messages?.[messages.length - 1]?.content ?? "") as string | unknown[];

  // Routing model

  // If your agent IDs are like "github/gpt-4o-mini" or "groq/llama-3.1-8b-instant" or "google/gemini-2.5-flash"
  const isGithub = typeof model === "string" && model.startsWith("github/");
  const isGroq = typeof model === "string" && model.startsWith("groq/");
  const isGoogle = typeof model === "string" && model.startsWith("google/");
  const isOpencode = typeof model === "string" && model.startsWith("opencode/");
  const isOpenrouter = typeof model === "string" && model.startsWith("openrouter/");
  const isN8n = typeof model === "string" && model.startsWith("n8n/");
  const isCerebras = typeof model === "string" && model.startsWith("cerebras/");
  const isOpenai = typeof model === "string" && model.startsWith("openai/");
  const isAnthropic = typeof model === "string" && model.startsWith("anthropic/");
  const isCustomApi = typeof model === "string" && model.startsWith("custom-api/");
  const isWebhook = typeof model === "string" && model.startsWith("webhook/");

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
      system,
      temperature,
      maxTokens,
    });
  }

  if (isCerebras) {
    const cerebrasModel = model.replace(/^cerebras\//, "");
    return Providers.cerebras.generate(lastContent, {
      model: cerebrasModel || "llama-3.3-70b",
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isOpenai) {
    const openaiModel = model.replace(/^openai\//, "");
    return Providers.openai.generate(lastContent, {
      model: openaiModel || "gpt-4o-mini",
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isAnthropic) {
    const anthropicModel = model.replace(/^anthropic\//, "");
    return Providers.anthropic.generate(lastContent, {
      model: anthropicModel || "claude-3-5-haiku-latest",
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
    });
  }

  if (isCustomApi) {
    const customApiModel = model.replace(/^custom-api\//, "");
    return Providers["custom-api"].generate(lastContent, {
      model: customApiModel || "custom-model",
      system,
      temperature,
      maxTokens,
      apiKey: userApiKey,
      baseUrl,
    });
  }

  if (isWebhook) {
    const webhookModel = model.replace(/^webhook\//, "");
    return Providers.webhook.generate(lastContent, {
      model: webhookModel || "webhook",
      system,
      temperature,
      apiKey: userApiKey,
      baseUrl,
    });
  }

  // Default: OpenRouter provider (supports many free models)
  return Providers.openrouter.generate(lastContent, {
    model: model || "google/gemini-flash-1.5",
    system,
    temperature,
    maxTokens,
    apiKey: userApiKey,
  });
}
