import type { RelationshipEdge, ActionType } from './types';

// Lookup table for interaction value deltas — add more as you add interaction types
const INTERACTION_VALUES: Record<string, number> = {
  socialize: 3,
  gift: 5,
  conflict: -10,
  betray: -20,
};

const DECAY_FACTOR = 0.999; // slow exponential decay reads more natural than linear

// Always store edges with npcIdA < npcIdB to prevent duplicate (A,B)/(B,A) rows
export function orderedPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

export function applyInteraction(
  edge: RelationshipEdge,
  interaction: keyof typeof INTERACTION_VALUES,
  currentTick: number
): RelationshipEdge {
  const delta = INTERACTION_VALUES[interaction] ?? 0;
  return {
    ...edge,
    score: clamp(edge.score + delta),
    lastInteractionTick: currentTick,
  };
}

// Only decay if there's been no interaction recently — avoids decaying every edge every tick
export function decayRelationship(
  edge: RelationshipEdge,
  currentTick: number,
  idleTicksBeforeDecay = 10
): RelationshipEdge {
  if (currentTick - edge.lastInteractionTick < idleTicksBeforeDecay) return edge;
  return { ...edge, score: Math.round(edge.score * DECAY_FACTOR) };
}

// Feed this into utility AI scores — e.g. score *= relationshipModifier(score, action)
export function relationshipModifier(score: number, action: ActionType): number {
  if (action === 'flee' || action === 'work') return 1;
  if (score < -20) return action === 'socialize' ? 0.2 : 1.5;
  if (score > 20) return action === 'socialize' ? 1.5 : 0.5;
  return 1;
}

function clamp(value: number, min = -100, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
