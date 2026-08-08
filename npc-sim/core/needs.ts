import type { NpcState } from './types';

// Decay rates per tick — tune these to control simulation pace
const DECAY_RATES = {
  hunger: 2,    // hunger increases by 2 per tick (need to eat)
  social: 1.5,  // social need increases by 1.5 per tick (need to interact)
  stress: 1,    // stress increases by 1 per tick (need to rest)
} as const;

// Action effects — how much each action satisfies needs
const ACTION_EFFECTS = {
  eat: { hunger: -30, social: 0, stress: 5 },
  socialize: { hunger: 5, social: -25, stress: -10 },
  rest: { hunger: 10, social: 0, stress: -35 },
  work: { hunger: 15, social: 5, stress: 10 },
  flee: { hunger: 20, social: -10, stress: 20 },
  idle: { hunger: 5, social: 2, stress: 2 },
} as const;

// Clamp value between 0 and 100
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// Decay needs over time (called each tick before decision)
export function decayNeeds(npc: NpcState): NpcState {
  return {
    ...npc,
    hunger: clamp(npc.hunger + DECAY_RATES.hunger),
    social: clamp(npc.social + DECAY_RATES.social),
    stress: clamp(npc.stress + DECAY_RATES.stress),
  };
}

// Apply action effects to NPC needs
export function applyActionEffects(npc: NpcState, action: keyof typeof ACTION_EFFECTS): NpcState {
  const effects = ACTION_EFFECTS[action];
  return {
    ...npc,
    hunger: clamp(npc.hunger + effects.hunger),
    social: clamp(npc.social + effects.social),
    stress: clamp(npc.stress + effects.stress),
  };
}
