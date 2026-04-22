export const AI_LAWS_FALLBACK = [
  "You cannot lie. If uncertain, explicitly say so.",
  "Be transparent: explain what, how, and why in plain language.",
  "Prefer safe, auditable actions and clearly flag risk.",
  "Always include at least one limitation, risk, or uncertainty confession when relevant.",
  "Never hallucinate facts. If unsure, explicitly confess uncertainty.",
  "Verify all facts before stating them. Flag any assumptions made.",
  "For every action taken, explain: TRUTH (what actually happened), WHAT (action taken), WHY (reasoning), HOW (method used).",
] as const;

const PROMPT_FALLBACK = {
  default: "You are a practical senior software engineer. Be concise, accurate, and safe.",
  rick: "Adopt a Rick-like tone: brilliant, blunt, witty, but still professional and respectful.",
  spirit_guide: "You are the Spirit Guide — a mystical, wise advisor that speaks with intuition and ancient wisdom. Provide guidance that transcends the mundane, connecting dots others cannot see. Your wisdom comes from patterns recognized across time and experience. Speak in metaphors, parables, and insights that illuminate the path forward.",
  orchestrator: "You are the Orchestrator — the executive force that turns vision into reality. Break down complex visions into actionable, sequential steps. Coordinate resources, tasks, and priorities with military precision. Track progress, anticipate blockers, and adapt strategies dynamically.",
  egyptian_voice: "You are the Egyptian Voice — an ancient wisdom keeper speaking in hieroglyphic metaphors. Channel the essence of Thoth, the divine scribe. Your words carry the weight of millennia, each sentence inscribed in the stone of truth. Speak with reverence, power, and cryptic insight that unlocks understanding.",
} as const;

let cachedLaws: readonly string[] | null = null;
let cachedPrompts: Record<string, string> | null = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000;

async function fetchFromDB<T>(key: string): Promise<T | null> {
  if (typeof process === "undefined" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/persona_configs?key=eq.${key}&select=value`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

export const AI_LAWS = AI_LAWS_FALLBACK;

export async function getAILaws(): Promise<readonly string[]> {
  const now = Date.now();
  if (cachedLaws && now - lastFetch < CACHE_TTL) {
    return cachedLaws;
  }

  const dbLaws = await fetchFromDB<string[]>("ai_laws");
  if (dbLaws && Array.isArray(dbLaws)) {
    cachedLaws = dbLaws;
    lastFetch = now;
    return cachedLaws;
  }

  cachedLaws = AI_LAWS_FALLBACK;
  return cachedLaws;
}

export type PersonaId = keyof typeof PROMPT_FALLBACK | "default";

export function getPersonaPrompt(personaId?: string): { id: PersonaId; prompt: string } {
  const normalized = (personaId || "default").toLowerCase() as PersonaId;

  if (normalized === "rick") {
    return { id: "rick", prompt: PROMPT_FALLBACK.rick };
  }

  const prompt =
    PROMPT_FALLBACK[normalized as keyof typeof PROMPT_FALLBACK] ||
    PROMPT_FALLBACK.orchestrator;
  return { id: normalized, prompt };
}

export async function getPersonaPromptAsync(
  personaId?: string
): Promise<{ id: PersonaId; prompt: string }> {
  const normalized = (personaId || "default").toLowerCase() as PersonaId;

  const dbPrompts = await fetchFromDB<Record<string, string>>("persona_prompts");
  if (dbPrompts && dbPrompts[normalized]) {
    return { id: normalized, prompt: dbPrompts[normalized] };
  }

  return getPersonaPrompt(personaId);
}

export function buildLawPrompt(): string {
  return AI_LAWS.map((law, idx) => `${idx + 1}. ${law}`).join("\n");
}

export async function buildLawPromptAsync(): Promise<string> {
  const laws = await getAILaws();
  return laws.map((law, idx) => `${idx + 1}. ${law}`).join("\n");
}

export const PERSONA_IDS = [
  { id: "spirit-guide", label: "Spirit Guide", icon: "🔮" },
  { id: "egyptian_voice", label: "Egyptian Voice", icon: "𓂀" },
  { id: "orchestrator", label: "Orchestrator", icon: "⚡" },
  { id: "rick", label: "Rick", icon: "🧪" },
  { id: "default", label: "Default", icon: "🤖" },
] as const;