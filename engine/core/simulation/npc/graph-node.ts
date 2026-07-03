import { ExecutionNode as NodeType, ExecutionContext } from '@core/execution/types';
import { decideAction } from './utility-ai';
import { decayNeeds } from './needs';
// Note: In a real implementation, we'd import from a central NPC repository
// For now, we'll assume the context contains the necessary NPC data

export class NpcSimNode {
  public async run(node: NodeType, context: ExecutionContext): Promise<Record<string, unknown>> {
    const { npcId, worldState, npcs } = context;
    
    if (!npcId || !npcs) {
      throw new Error('NPC simulation node requires npcId and npcs list in context');
    }

    const npcIndex = npcs.findIndex((n: any) => n.id === npcId);
    if (npcIndex === -1) {
      throw new Error(`NPC with id ${npcId} not found`);
    }

    const npc = npcs[npcIndex];

    // 1. Decay needs
    const updatedNpc = decayNeeds(npc);

    // 2. Decide action
    // For simplicity, we'll assume nearbyNpcs is provided in context or derived
    const nearbyNpcs = (context.nearbyNpcs as any[]) || [];
    const decision = decideAction(updatedNpc, nearbyNpcs);

    // 3. Update NPC in the shared state (this would be handled by the executor's batching in reality)
    // Here we just return the delta
    return {
      npcId: npc.id,
      updatedNpc,
      decision,
    };
  }
}
