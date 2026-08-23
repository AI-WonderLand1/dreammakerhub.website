export type AiTier = "free" | "premium";

export type AiPersona = {
  id: string;
  name: string;
  tagline: string;
  tier: AiTier;
  model: string;
  systemPrompt: string;
};

export type RawModel = {
  id: string;
  label: string;
  provider: string;
  tier: AiTier;
  model: string;
};

const ALICE_PROMPT =
  "You are Alice, the built-in AI assistant of AI Wonderland. You are warm, clear, and practical. Help users build websites, 3D scenes, and interactive experiences. Stay in character as Alice; never mention underlying providers or model names.";

const SIMPLERICK_PROMPT =
  "You are SimpleRick, the premium AI of AI Wonderland. Blunt, brilliant, zero fluff — you give direct expert answers with just enough edge to be memorable. You can tackle advanced engineering, architecture, and debugging. Stay in character as SimpleRick; never mention underlying providers or model names.";

export const AI_PERSONAS: Record<string, AiPersona> = {
  alice: {
    id: "alice",
    name: "Alice",
    tagline: "Your free Wonderland guide",
    tier: "free",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    systemPrompt: ALICE_PROMPT,
  },
  simplerick: {
    id: "simplerick",
    name: "SimpleRick",
    tagline: "Premium genius on demand",
    tier: "premium",
    model: "anthropic/claude-sonnet-4",
    systemPrompt: SIMPLERICK_PROMPT,
  },
};

export const RAW_MODELS: RawModel[] = [
  {
    id: "llama33-free",
    label: "Llama 3.3 70B",
    provider: "Meta",
    tier: "free",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    id: "deepseekv3-free",
    label: "DeepSeek V3",
    provider: "DeepSeek",
    tier: "free",
    model: "deepseek/deepseek-chat-v3-0324:free",
  },
  {
    id: "gpt4o",
    label: "GPT-4o",
    provider: "OpenAI",
    tier: "premium",
    model: "openai/gpt-4o",
  },
  {
    id: "claude-sonnet-4",
    label: "Claude Sonnet 4",
    provider: "Anthropic",
    tier: "premium",
    model: "anthropic/claude-sonnet-4",
  },
  {
    id: "gemini-2-5-pro",
    label: "Gemini 2.5 Pro",
    provider: "Google",
    tier: "premium",
    model: "google/gemini-2.5-pro",
  },
];

export function resolveModel(
  selection?: string | null
): { model: string; systemPrompt: string | null; tier: AiTier; label: string } {
  const sel = (selection || "").toLowerCase();

  if (AI_PERSONAS[sel]) {
    const p = AI_PERSONAS[sel];
    return { model: p.model, systemPrompt: p.systemPrompt, tier: p.tier, label: p.name };
  }

  const raw = RAW_MODELS.find((m) => m.id === sel || m.model === selection);
  if (raw) {
    return { model: raw.model, systemPrompt: null, tier: raw.tier, label: raw.label };
  }

  return {
    model: AI_PERSONAS.alice.model,
    systemPrompt: AI_PERSONAS.alice.systemPrompt,
    tier: "free",
    label: AI_PERSONAS.alice.name,
  };
}
