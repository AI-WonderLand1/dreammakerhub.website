import { db } from '@/db';
import { npcs, relationships } from '@/db/schema/npc-sim';

const INITIAL_NPCS = [
  {
    id: 'alice',
    name: 'Alice',
    hunger: 30,
    social: 70,
    stress: 20,
    traits: { aggression: 20, sociability: 80, ambition: 60 },
    status: 'alive' as const,
    age: 25,
  },
  {
    id: 'rick',
    name: 'Rick',
    hunger: 40,
    social: 50,
    stress: 40,
    traits: { aggression: 60, sociability: 40, ambition: 70 },
    status: 'alive' as const,
    age: 30,
  },
  {
    id: 'luna',
    name: 'Luna',
    hunger: 20,
    social: 80,
    stress: 15,
    traits: { aggression: 10, sociability: 90, ambition: 50 },
    status: 'alive' as const,
    age: 22,
  },
  {
    id: 'max',
    name: 'Max',
    hunger: 50,
    social: 30,
    stress: 60,
    traits: { aggression: 70, sociability: 30, ambition: 80 },
    status: 'alive' as const,
    age: 35,
  },
  {
    id: 'zoe',
    name: 'Zoe',
    hunger: 25,
    social: 60,
    stress: 30,
    traits: { aggression: 30, sociability: 70, ambition: 40 },
    status: 'alive' as const,
    age: 28,
  },
];

const INITIAL_RELATIONSHIPS = [
  { npcIdA: 'alice', npcIdB: 'rick', score: 30, type: 'ally' as const },
  { npcIdA: 'alice', npcIdB: 'luna', score: 60, type: 'romantic' as const },
  { npcIdA: 'rick', npcIdB: 'max', score: -20, type: 'rival' as const },
  { npcIdA: 'luna', npcIdB: 'zoe', score: 40, type: 'family' as const },
  { npcIdA: 'max', npcIdB: 'zoe', score: 10, type: 'neutral' as const },
];

function orderedPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

async function seed() {
  console.log('Seeding NPCs...');

  // Insert NPCs
  for (const npc of INITIAL_NPCS) {
    await db.insert(npcs).values({
      ...npc,
      createdAtTick: 0,
    }).onConflictDoNothing();
  }

  console.log(`Seeded ${INITIAL_NPCS.length} NPCs`);

  // Insert relationships
  for (const rel of INITIAL_RELATIONSHIPS) {
    const [a, b] = orderedPair(rel.npcIdA, rel.npcIdB);
    await db.insert(relationships).values({
      id: crypto.randomUUID(),
      npcIdA: a,
      npcIdB: b,
      score: rel.score,
      type: rel.type,
      lastInteractionTick: 0,
    }).onConflictDoNothing();
  }

  console.log(`Seeded ${INITIAL_RELATIONSHIPS.length} relationships`);
}

seed().catch((err) => {
  console.error('NPC seed failed:', err);
  process.exit(1);
});
