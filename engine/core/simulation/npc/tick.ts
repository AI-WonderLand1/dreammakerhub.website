import type { NpcState, SimEvent, DecidedAction } from './types';
import { decayNeeds } from './needs';
import { decideAction } from './utility-ai';

export interface TickContext {
  npcs: NpcState[];
  worldState: {
    currentTick: number;
    isPaused: boolean;
  };
  // In a real implementation, this would include DB access or a batch-write queue
  onUpdate: (updatedNpcs: NpcState[], newEvents: SimEvent[], nextTick: number) => Promise<void>;
}

export async function runTick(context: TickContext): Promise<{ tick: number; decisions: DecidedAction[] }> {
  const { npcs, worldState, onUpdate } = context;

  if (worldState.isPaused) {
    return { tick: worldState.currentTick, decisions: [] };
  }

  const currentTick = worldState.currentTick;

  // 1. Decay needs in memory
  const updatedNpcs: NpcState[] = npcs.map(decayNeeds);

  // 2. Decide actions
  const decisions: DecidedAction[] = updatedNpcs.map((npc) => {
    // For simplicity, we'll assume nearbyNpcs is empty for now
    const decision = decideAction(npc, []);
    return {
      npcId: npc.id,
      action: decision.action,
      targetNpcId: decision.targetNpcId,
    };
  });

  // 3. Build event log entries
  const newEvents: SimEvent[] = decisions
    .filter((d) => d.action !== 'idle')
    .map((d) => ({
      tick: currentTick,
      type: 'dialogue' as any, // Placeholder
      actorId: d.npcId,
      targetId: d.targetNpcId,
      description: `${d.npcId} performed ${d.action}${d.targetNpcId ? ` with ${d.targetNpcId}` : ''}`,
    }));

  // 4. Commit changes via the provided callback
  await onUpdate(updatedNpcs, newEvents, currentTick + 1);

  return { tick: currentTick + 1, decisions };
}
