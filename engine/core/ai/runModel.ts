import { Providers } from "./providers";

type ProviderName = keyof typeof Providers;

type ProviderRoute = {
  provider: (typeof Providers)[ProviderName];
  defaultModel?: string;
};

const providerRegistry: Record<string, ProviderRoute> = {
  github:        { provider: Providers.github },
  groq:          { provider: Providers.groq },
  google:        { provider: Providers.google },
  openrouter:    { provider: Providers.openrouter, defaultModel: "google/gemini-flash-1.5" },
  opencode:      { provider: Providers.opencode, defaultModel: "opencode/big-pickle" },
  n8n:           { provider: Providers.n8n },
  cerebras:      { provider: Providers.cerebras, defaultModel: "llama-3.3-70b" },
  openai:        { provider: Providers.openai, defaultModel: "gpt-4o-mini" },
  anthropic:     { provider: Providers.anthropic, defaultModel: "claude-3-5-haiku-latest" },
  "custom-api":  { provider: Providers["custom-api"], defaultModel: "custom-model" },
  webhook:       { provider: Providers.webhook, defaultModel: "webhook" },
  dreammakerhub: { provider: Providers.dreammakerhub },
};

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
    return route.provider.generate(lastContent, {
      model: modelName || route.defaultModel,
      system,
      temperature,
      ...(route.provider !== Providers.n8n && route.provider !== Providers.dreammakerhub ? { maxTokens } : {}),
      ...(route.provider !== Providers.n8n && route.provider !== Providers.webhook && route.provider !== Providers.dreammakerhub ? { apiKey: userApiKey } : {}),
      ...(baseUrl && (route.provider === Providers["custom-api"] || route.provider === Providers.webhook) ? { baseUrl } : {}),
    });
  }

  return Providers.openrouter.generate(lastContent, {
    model: model || "google/gemini-flash-1.5",
    system,
    temperature,
    maxTokens,
    apiKey: userApiKey,
  });
}
