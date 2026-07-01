import type { NpcState, ActionType, DecidedAction, SimEvent } from './types';
import { decideAction } from './utility-ai';

const VALID_ACTIONS: ActionType[] = ['eat', 'socialize', 'rest', 'work', 'flee', 'idle'];

// Cheap/fast model tier — this runs every tick for named NPCs, don't burn your top-tier model on it
const MODEL = 'claude-haiku-4-5-20251001';

interface LlmDecision {
  action: ActionType;
  dialogue: string | null;
  targetNpcId: string | null;
}

export async function decideActionWithLLM(
  npc: NpcState,
  recentMemory: SimEvent[],
  nearby: NpcState[]
): Promise<DecidedAction & { dialogue?: string }> {
  const prompt = buildPrompt(npc, recentMemory, nearby);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system:
          'You control one NPC in a life simulation. Respond ONLY with valid JSON, no markdown, no preamble. ' +
          'Format: {"action": "eat|socialize|rest|work|flee|idle", "dialogue": "short line or null", "targetNpcId": "id or null"}',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`LLM request failed: ${response.status}`);

    const data = await response.json();
    const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed: LlmDecision = JSON.parse(cleaned);

    if (!VALID_ACTIONS.includes(parsed.action)) {
      throw new Error(`LLM returned invalid action: ${parsed.action}`);
    }

    return {
      npcId: npc.id,
      action: parsed.action,
      targetNpcId: parsed.targetNpcId ?? undefined,
      dialogue: parsed.dialogue ?? undefined,
    };
  } catch (err) {
    // Fall back to utility AI on any parse/network failure — never let a bad LLM call stall the tick
    console.error(`LLM decision failed for ${npc.id}, falling back to utility AI:`, err);
    return decideAction(npc, nearby);
  }
}

function buildPrompt(npc: NpcState, recentMemory: SimEvent[], nearby: NpcState[]): string {
  return JSON.stringify({
    npc: {
      id: npc.id,
      name: npc.name,
      needs: { hunger: npc.hunger, social: npc.social, stress: npc.stress },
      traits: npc.traits,
    },
    recentMemory: recentMemory.slice(-5).map((e) => e.description),
    nearbyNpcs: nearby.map((n) => ({ id: n.id, name: n.name })),
  });
}

// --- Hybrid routing ---
// Named/key NPCs get LLM calls; everyone else is utility-AI-only, always.
const NAMED_NPC_IDS = new Set<string>(['alice', 'rick']); // extend as you add key characters
const MAX_LLM_CALLS_PER_TICK = 5; // hard budget — keeps cost predictable as population grows

export function planDecisions(npcs: NpcState[]): { llmCandidates: NpcState[]; utilityOnly: NpcState[] } {
  const llmCandidates: NpcState[] = [];
  const utilityOnly: NpcState[] = [];

  for (const npc of npcs) {
    if (NAMED_NPC_IDS.has(npc.id) && llmCandidates.length < MAX_LLM_CALLS_PER_TICK) {
      llmCandidates.push(npc);
    } else {
      utilityOnly.push(npc);
    }
  }

  return { llmCandidates, utilityOnly };
}
