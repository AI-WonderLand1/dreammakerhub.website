import type { NpcState, ActionType } from './types';

export function decideAction(npc: NpcState, nearbyNpcs: NpcState[]): { action: ActionType; targetNpcId?: string } {
  const candidateActions: ActionType[] = ['eat', 'socialize', 'rest', 'work', 'flee', 'idle'];
  
  let bestAction: ActionType = 'idle';
  let maxScore = -1;
  let bestTargetId: string | undefined = undefined;

  for (const action of candidateActions) {
    const score = calculateScore(action, npc, nearbyNpcs);
    
    // Add small random jitter (+/- 5)
    const jitter = (Math.random() * 10) - 5;
    const finalScore = score + jitter;

    if (finalScore > maxScore) {
      maxScore = finalScore;
      bestAction = action;
      
      // For socialization, try to pick a nearby NPC
      if (action === 'socialize' && nearbyNpcs.length > 0) {
        bestTargetId = nearbyNpcs[Math.floor(Math.random() * nearbyNpcs.length)].id;
      }
    }
  }

  // If the best score is very low, just idle
  if (maxScore <= 0) {
    return { action: 'idle' };
  }

  return {
    action: bestAction,
    targetNpcId: bestTargetId,
  };
}

function calculateScore(action: ActionType, npc: NpcState, nearbyNpcs: NpcState[]): number {
  switch (action) {
    case 'eat':
      return npc.hunger * 1.0;
    case 'socialize':
      // Higher score if there are many nearby NPCs
      return npc.social * 0.8 + (nearbyNpcs.length * 0.5);
    case 'rest':
      return npc.stress * 0.9;
    case 'work':
      // Ambition trait influence
      return (100 - npc.hunger) * 0.3 + (npc.traits.ambition * 0.2);
    case 'flee':
      // Threshold-gated: flee only if stress is high
      return npc.stress > 80 ? npc.stress * 1.5 : 0;
    case 'idle':
    default:
      return 0;
  }
}
