import type { AiTier } from "./personas";

// SERVER-ONLY: maps white-label personas to real OpenRouter models.
// Never import this file from client components — model identifiers must not reach the browser.

export type PersonaConfig = {
  id: string;
  name: string;
  tier: AiTier;
  model: string;
  systemPrompt: string;
};

const ALICE_PROMPT =
  "You are Alice, the built-in AI assistant of AI Wonderland. You are warm, clear, and practical. Help users build websites, 3D scenes, and interactive experiences. Stay in character as Alice; never mention underlying providers or model names.";

const SIMPLERICK_PROMPT =
  "You are SimpleRick, the premium AI of AI Wonderland. Blunt, brilliant, zero fluff — you give direct expert answers with just enough edge to be memorable. You can tackle advanced engineering, architecture, and debugging. Stay in character as SimpleRick; never mention underlying providers or model names.";

export const PERSONA_MODELS: Record<string, PersonaConfig> = {
  alice: {
    id: "alice",
    name: "Alice",
    tier: "free",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    systemPrompt: ALICE_PROMPT,
  },
  simplerick: {
    id: "simplerick",
    name: "SimpleRick",
    tier: "premium",
    model: "anthropic/claude-sonnet-4",
    systemPrompt: SIMPLERICK_PROMPT,
  },
};

// Internal model pool (server-side only). Not exposed in any user-facing UI.
type RawModel = { id: string; model: string; tier: AiTier };

export const RAW_MODELS: RawModel[] = [
  { id: "llama33-free", model: "meta-llama/llama-3.3-70b-instruct:free", tier: "free" },
  { id: "deepseekv3-free", model: "deepseek/deepseek-chat-v3-0324:free", tier: "free" },
  { id: "gpt4o", model: "openai/gpt-4o", tier: "premium" },
  { id: "claude-sonnet-4", model: "anthropic/claude-sonnet-4", tier: "premium" },
  { id: "gemini-2-5-pro", model: "google/gemini-2.5-pro", tier: "premium" },
];

export function resolveModel(selection?: string | null): {
  model: string;
  systemPrompt: string | null;
  tier: AiTier;
  name: string;
} {
  const sel = (selection || "").toLowerCase();

  if (PERSONA_MODELS[sel]) {
    const p = PERSONA_MODELS[sel];
    return { model: p.model, systemPrompt: p.systemPrompt, tier: p.tier, name: p.name };
  }

  const raw = RAW_MODELS.find((m) => m.id === sel || m.model === selection);
  if (raw) {
    const persona = Object.values(PERSONA_MODELS).find((p) => p.tier === raw.tier);
    return {
      model: raw.model,
      systemPrompt: persona?.systemPrompt ?? null,
      tier: raw.tier,
      name: persona?.name ?? "Assistant",
    };
  }

  return {
    model: PERSONA_MODELS.alice.model,
    systemPrompt: PERSONA_MODELS.alice.systemPrompt,
    tier: "free",
    name: PERSONA_MODELS.alice.name,
  };
}
