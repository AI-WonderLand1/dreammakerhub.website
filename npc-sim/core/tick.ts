// Run this once before your first tick: tsx db/seed/world-state.ts
import { db } from '@/db';
import { npcs, events, worldState } from '@/db/schema/npc-sim';
import { eq } from 'drizzle-orm';
import { decayNeeds } from './needs';
import { decideAction } from './utility-ai';
import type { NpcState, SimEvent, DecidedAction } from './types';

export async function runTick() {
  const world = await db.select().from(worldState).limit(1).then((rows) => rows[0]);

  if (!world) {
    throw new Error('worldState has no row — seed it with one row (id: 1) before running ticks');
  }
  if (world.isPaused) {
    return { skipped: true, currentTick: world.currentTick };
  }

  const currentTick = world.currentTick;

  // One query, not N — fetch everyone alive once per tick
  const aliveNpcRows = await db.select().from(npcs).where(eq(npcs.status, 'alive'));
  const aliveNpcs = aliveNpcRows as unknown as NpcState[];

  // Decay needs in memory first — no writes yet
  const updatedNpcs: NpcState[] = aliveNpcs.map(decayNeeds);

  // Decide actions — pure function, no side effects
  const decisions: DecidedAction[] = updatedNpcs.map((npc) =>
    decideAction(npc, updatedNpcs.filter((n) => n.id !== npc.id))
  );

  // Build event log entries for anything that wasn't 'idle'
  const newEvents: SimEvent[] = decisions
    .filter((d) => d.action !== 'idle')
    .map((d) => ({
      tick: currentTick,
      type: 'dialogue', // swap for a more specific type as you add real action effects
      actorId: d.npcId,
      targetId: d.targetNpcId,
      description: `${d.npcId} performed ${d.action}${d.targetNpcId ? ` with ${d.targetNpcId}` : ''}`,
    }));

  // Single transaction — tick either fully applies or doesn't (no half-applied state on crash)
  await db.transaction(async (tx) => {
    for (const npc of updatedNpcs) {
      await tx
        .update(npcs)
        .set({ hunger: npc.hunger, social: npc.social, stress: npc.stress })
        .where(eq(npcs.id, npc.id));
    }

    if (newEvents.length > 0) {
      await tx.insert(events).values(
        newEvents.map((e) => ({
          id: crypto.randomUUID(),
          ...e,
        }))
      );
    }

    await tx
      .update(worldState)
      .set({ currentTick: currentTick + 1 })
      .where(eq(worldState.id, 1));
  });

  return { tick: currentTick + 1, decisions };
}
