import { Providers } from "./providers";
import type { AIResponse } from "./types";

type ProviderName = keyof typeof Providers;

type ProviderRoute = {
  provider: (typeof Providers)[ProviderName];
  defaultModel?: string;
};

const providerRegistry: Record<string, ProviderRoute> = {
  github:        { provider: Providers.github },
  groq:          { provider: Providers.groq, defaultModel: "openai/gpt-oss-120b" },
  google:        { provider: Providers.google, defaultModel: "gemini-2.5-flash" },
  openrouter:    { provider: Providers.openrouter, defaultModel: "meta-llama/llama-3.3-70b-instruct:free" },
  opencode:      { provider: Providers.opencode, defaultModel: "opencode/big-pickle" },
  n8n:           { provider: Providers.n8n },
  cerebras:      { provider: Providers.cerebras, defaultModel: "gpt-oss-120b" },
  openai:        { provider: Providers.openai, defaultModel: "gpt-4o-mini" },
  anthropic:     { provider: Providers.anthropic, defaultModel: "claude-3-5-haiku-latest" },
  "custom-api":  { provider: Providers["custom-api"], defaultModel: "custom-model" },
  webhook:       { provider: Providers.webhook, defaultModel: "webhook" },
  dreammakerhub: { provider: Providers.dreammakerhub },
};

const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";
const DEFAULT_CEREBRAS_MODEL = "gpt-oss-120b";

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

async function runPlatformFallbacks(
  prompt: string | unknown[],
  {
    system,
    temperature,
    maxTokens,
  }: {
    system?: string;
    temperature: number;
    maxTokens: number;
  },
  primary: AIResponse,
): Promise<AIResponse> {
  const attempts: AIResponse[] = [primary];

  if (hasValue(process.env.GROQ_API_KEY)) {
    const result = await Providers.groq.generate(prompt, {
      model: DEFAULT_GROQ_MODEL,
      system,
      temperature,
      maxTokens,
    });
    attempts.push(result);
    if (!result.error) return result;
  }

  if (hasValue(process.env.GEMINI_API_KEY) || hasValue(process.env.GOOGLE_AI_KEY) || hasValue(process.env.GOOGLE_AI_API_KEY)) {
    const result = await Providers.google.generate(prompt, {
      model: DEFAULT_GOOGLE_MODEL,
      system,
      temperature,
      maxTokens,
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GOOGLE_AI_API_KEY,
    });
    attempts.push(result);
    if (!result.error) return result;
  }

  if (hasValue(process.env.CEREBRAS_API_KEY)) {
    const result = await Providers.cerebras.generate(prompt, {
      model: DEFAULT_CEREBRAS_MODEL,
      system,
      temperature,
      maxTokens,
    });
    attempts.push(result);
    if (!result.error) return result;
  }

  const limitations = attempts.flatMap((attempt) => attempt.confessions?.limitations ?? []);
  const providers = attempts.map((attempt) => attempt.provider).filter(Boolean).join(" -> ");

  return {
    text: "All configured AI providers failed. Check provider credentials, access, or usage limits.",
    error: true,
    provider: "fallback-chain",
    confessions: {
      confidence: 0,
      reasoning: [providers ? `Provider attempts: ${providers}` : "No usable provider returned a response"],
      limitations: limitations.length ? limitations : ["No configured fallback provider succeeded"],
    },
  };
}

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

  const slashIndex = typeof model === "string" ? model.indexOf("/") : -1;
  const prefix = slashIndex > 0 ? model.slice(0, slashIndex) : "";
  const modelName = slashIndex > 0 ? model.slice(slashIndex + 1) : model;

  const route = providerRegistry[prefix];

  if (route) {
    const result = await route.provider.generate(lastContent, {
      model: modelName || route.defaultModel,
      system,
      temperature,
      ...(route.provider !== Providers.n8n && route.provider !== Providers.dreammakerhub ? { maxTokens } : {}),
      ...(route.provider !== Providers.n8n && route.provider !== Providers.webhook && route.provider !== Providers.dreammakerhub ? { apiKey: userApiKey } : {}),
      ...(baseUrl && (route.provider === Providers["custom-api"] || route.provider === Providers.webhook) ? { baseUrl } : {}),
    });

    // Platform-owned OpenRouter requests should remain usable when OpenRouter is
    // missing or unavailable. If the caller supplied its own key, preserve the
    // explicit BYOK provider choice rather than silently sending it elsewhere.
    if (route.provider === Providers.openrouter && result.error && !userApiKey) {
      return runPlatformFallbacks(lastContent, { system, temperature, maxTokens }, result);
    }

    return result;
  }

  const primary = await Providers.openrouter.generate(lastContent, {
    model: model || DEFAULT_OPENROUTER_MODEL,
    system,
    temperature,
    maxTokens,
    apiKey: userApiKey,
  });

  if (!primary.error || userApiKey) return primary;
  return runPlatformFallbacks(lastContent, { system, temperature, maxTokens }, primary);
}
