import type { NpcState, ActionType, DecidedAction, SimEvent } from './types';
import { decideAction } from './utility-ai';

const CANDIDATE_ACTIONS: ActionType[] = ['eat', 'socialize', 'rest', 'work', 'flee'];

// Weights — tune these, then leave them alone until you've watched behavior for a while
const WEIGHTS = {
  eat: 1.0,
  socialize: 0.8,
  rest: 0.9,
  work: 0.3,
  flee: 1.5,
} as const;

// Small jitter so NPCs don't all act in perfect lockstep
const JITTER = 5;

export function scoreAction(action: ActionType, npc: NpcState): number {
  const jitter = (Math.random() * 2 - 1) * JITTER;

  switch (action) {
    case 'eat':
      return npc.hunger * WEIGHTS.eat + jitter;
    case 'socialize':
      return npc.social * WEIGHTS.socialize + jitter;
    case 'rest':
      return npc.stress * WEIGHTS.rest + jitter;
    case 'work':
      return (100 - npc.hunger) * WEIGHTS.work + npc.traits.ambition * 0.2 + jitter;
    case 'flee':
      // Threshold-gated — fleeing is only on the table once stress is critical
      return npc.stress > 80 ? npc.stress * WEIGHTS.flee + jitter : 0;
    default:
      return 0;
  }
}

export function decideAction(npc: NpcState, nearby: NpcState[] = []): DecidedAction {
  let bestAction: ActionType = 'idle';
  let bestScore = -Infinity;

  for (const action of CANDIDATE_ACTIONS) {
    const score = scoreAction(action, npc);
    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  const targetNpcId =
    bestAction === 'socialize' && nearby.length > 0
      ? nearby[Math.floor(Math.random() * nearby.length)].id
      : undefined;

  return { npcId: npc.id, action: bestAction, targetNpcId };
}
