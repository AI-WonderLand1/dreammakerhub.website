import { NextRequest, NextResponse } from "next/server";
import { requirePaidAIUser } from "@/app/api/ai/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NpcState = {
  id: string;
  name: string;
  hunger: number;
  social: number;
  stress: number;
  traits: { aggression: number; sociability: number; ambition: number };
  status: "alive" | "dead";
  age: number;
};

type ActionType = "eat" | "socialize" | "rest" | "work" | "flee" | "idle";

const DECAY_RATES = { hunger: 2, social: 1.5, stress: 1 } as const;
const ACTION_EFFECTS: Record<ActionType, { hunger: number; social: number; stress: number }> = {
  eat: { hunger: -30, social: 0, stress: 5 },
  socialize: { hunger: 5, social: -25, stress: -10 },
  rest: { hunger: 10, social: 0, stress: -35 },
  work: { hunger: 15, social: 5, stress: 10 },
  flee: { hunger: 20, social: -10, stress: 20 },
  idle: { hunger: 5, social: 2, stress: 2 },
};
const WEIGHTS: Record<string, number> = { eat: 1.0, socialize: 0.8, rest: 0.9, work: 0.3, flee: 1.5 };

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function scoreAction(action: ActionType, npc: NpcState): number {
  const jitter = (Math.random() * 2 - 1) * 5;
  switch (action) {
    case "eat": return npc.hunger * WEIGHTS.eat + jitter;
    case "socialize": return npc.social * WEIGHTS.socialize + jitter;
    case "rest": return npc.stress * WEIGHTS.rest + jitter;
    case "work": return (100 - npc.hunger) * WEIGHTS.work + npc.traits.ambition * 0.2 + jitter;
    case "flee": return npc.stress > 80 ? npc.stress * WEIGHTS.flee + jitter : 0;
    default: return 0;
  }
}

function decideAction(npc: NpcState): ActionType {
  let best: ActionType = "idle";
  let bestScore = -Infinity;
  for (const action of ["eat", "socialize", "rest", "work", "flee"] as ActionType[]) {
    const score = scoreAction(action, npc);
    if (score > bestScore) {
      bestScore = score;
      best = action;
    }
  }
  return best;
}

// In-memory sim state per server instance (resets on deploy — fine for a preview sim)
const state = new Map<string, NpcState[]>();
const stateTick = new Map<string, number>();

const TRAIT_SETS = [
  { aggression: 0.3, sociability: 0.7, ambition: 0.5 },
  { aggression: 0.8, sociability: 0.3, ambition: 0.9 },
  { aggression: 0.4, sociability: 0.6, ambition: 0.7 },
  { aggression: 0.2, sociability: 0.8, ambition: 0.4 },
  { aggression: 0.6, sociability: 0.4, ambition: 0.8 },
];

const NAME_POOL = ["Aldric", "Mira", "Torvin", "Sera", "Kael", "Nya", "Bram", "Elowen", "Dax", "Lyra", "Fen", "Ona"];

function buildInitialNpcs(count: number): NpcState[] {
  const npcs: NpcState[] = [];
  for (let i = 0; i < count; i++) {
    const traits = TRAIT_SETS[i % TRAIT_SETS.length];
    npcs.push({
      id: `npc-${i + 1}`,
      name: NAME_POOL[(i * 3) % NAME_POOL.length],
      hunger: Math.floor(Math.random() * 30),
      social: Math.floor(Math.random() * 30),
      stress: Math.floor(Math.random() * 30),
      traits: { ...traits },
      status: "alive",
      age: 18 + (i % 40),
    });
  }
  return npcs;
}

function getSim(simId: string): { npcs: NpcState[]; tick: number } {
  if (!state.has(simId)) {
    state.set(simId, buildInitialNpcs(5));
    stateTick.set(simId, 0);
  }
  return { npcs: state.get(simId)!, tick: stateTick.get(simId) ?? 0 };
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { action, simId = "default", count, name, traits } = await req.json();

    if (action === "create") {
      const npcCount = Math.max(1, Math.min(20, count ?? 5));
      state.set(simId, buildInitialNpcs(npcCount));
      stateTick.set(simId, 0);
      return NextResponse.json({ ok: true, npcs: state.get(simId), tick: 0 });
    }

    if (action === "add") {
      const sim = state.get(simId) ?? buildInitialNpcs(5);
      const traitsObj = traits && typeof traits === "object" ? traits : TRAIT_SETS[sim.length % TRAIT_SETS.length];
      sim.push({
        id: `npc-${Date.now().toString(36)}`,
        name: name || `NPC ${sim.length + 1}`,
        hunger: Math.floor(Math.random() * 30),
        social: Math.floor(Math.random() * 30),
        stress: Math.floor(Math.random() * 30),
        traits: traitsObj,
        status: "alive",
        age: 18 + (sim.length % 40),
      });
      state.set(simId, sim);
      return NextResponse.json({ ok: true, npcs: sim, tick: stateTick.get(simId) ?? 0 });
    }

    // default: run a tick
    const sim = getSim(simId);
    const updated: NpcState[] = [];
    const events: { npcId: string; action: ActionType; hunger: number; social: number; stress: number }[] = [];

    for (const npc of sim.npcs) {
      let next = {
        ...npc,
        hunger: clamp(npc.hunger + DECAY_RATES.hunger),
        social: clamp(npc.social + DECAY_RATES.social),
        stress: clamp(npc.stress + DECAY_RATES.stress),
      };
      const action = decideAction(next);
      const fx = ACTION_EFFECTS[action];
      next = {
        ...next,
        hunger: clamp(next.hunger + fx.hunger),
        social: clamp(next.social + fx.social),
        stress: clamp(next.stress + fx.stress),
      };
      updated.push(next);
      events.push({ npcId: npc.id, action, hunger: next.hunger, social: next.social, stress: next.stress });
    }

    state.set(simId, updated);
    const newTick = sim.tick + 1;
    stateTick.set(simId, newTick);

    return NextResponse.json({ ok: true, npcs: updated, tick: newTick, events });
  } catch (error: any) {
    logger.error("NPC sim tick error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SIM_FAILED", message: error?.message ?? "Simulation failed" } },
      { status: 500 },
    );
  }
}
