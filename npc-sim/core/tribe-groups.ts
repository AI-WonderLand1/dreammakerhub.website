import { db } from '@/db';
import { npcs, tribes } from '@/db/schema/npc-sim';
import { eq, and, isNull } from 'drizzle-orm';
import type { NpcState, RelationshipEdge } from './types';

const JOIN_THRESHOLD = 20; // avg relationship score with tribe members needed to join
const FOUND_AMBITION_THRESHOLD = 60;
const FOUND_MIN_NEARBY_UNAFFILIATED = 2;

// Call once per tick per unaffiliated NPC. Returns a tribeId to join, or null.
export function evaluateTribeJoin(
  npc: NpcState,
  tribeMembersByTribeId: Map<string, NpcState[]>,
  relationships: RelationshipEdge[]
): string | null {
  if (npc.tribeId) return null; // already in a tribe

  let bestTribeId: string | null = null;
  let bestAvgScore = -Infinity;

  for (const [tribeId, members] of tribeMembersByTribeId) {
    const scores = members
      .map((member) => getRelationshipScore(npc.id, member.id, relationships))
      .filter((s): s is number => s !== null);

    if (scores.length === 0) continue;

    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (avg > bestAvgScore) {
      bestAvgScore = avg;
      bestTribeId = tribeId;
    }
  }

  return bestAvgScore >= JOIN_THRESHOLD ? bestTribeId : null;
}

// Call once per tick per unaffiliated NPC with high ambition. Returns true if they should found a tribe.
export function evaluateTribeFounding(
  npc: NpcState,
  nearbyUnaffiliated: NpcState[],
  relationships: RelationshipEdge[]
): boolean {
  if (npc.tribeId) return false;
  if (npc.traits.ambition < FOUND_AMBITION_THRESHOLD) return false;

  const positiveNearby = nearbyUnaffiliated.filter((other) => {
    const score = getRelationshipScore(npc.id, other.id, relationships);
    return score !== null && score > 0;
  });

  return positiveNearby.length >= FOUND_MIN_NEARBY_UNAFFILIATED;
}

function getRelationshipScore(idA: string, idB: string, relationships: RelationshipEdge[]): number | null {
  const [a, b] = idA < idB ? [idA, idB] : [idB, idA];
  const edge = relationships.find((r) => r.npcIdA === a && r.npcIdB === b);
  return edge ? edge.score : null;
}

// --- DB-wired helpers ---

export async function getUnaffiliatedNpcs() {
  return db.select().from(npcs).where(and(eq(npcs.status, 'alive'), isNull(npcs.tribeId)));
}

export async function foundTribe(founder: NpcState, currentTick: number, name: string) {
  const tribeId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(tribes).values({
      id: tribeId,
      name,
      founderId: founder.id,
      foundedAtTick: currentTick,
    });
    await tx.update(npcs).set({ tribeId }).where(eq(npcs.id, founder.id));
  });
  return tribeId;
}

export async function joinTribe(npcId: string, tribeId: string) {
  await db.update(npcs).set({ tribeId }).where(eq(npcs.id, npcId));
}

// Aggregate stats computed on read — don't cache unless population gets large (1000+)
export async function getTribeAggregateStats(tribeId: string) {
  const members = await db.select().from(npcs).where(and(eq(npcs.tribeId, tribeId), eq(npcs.status, 'alive')));

  const population = members.length;
  const avgStress = population > 0 ? members.reduce((sum, m) => sum + m.stress, 0) / population : 0;

  return { tribeId, population, avgStress };
}
