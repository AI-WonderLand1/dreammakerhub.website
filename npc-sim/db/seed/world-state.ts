// Run this once before your first tick: tsx db/seed/world-state.ts
import { db } from '@/db';
import { worldState } from '@/db/schema/npc-sim';
import { eq } from 'drizzle-orm';

async function seed() {
  const existing = await db.select().from(worldState).where(eq(worldState.id, 1));

  if (existing.length > 0) {
    console.log('worldState already seeded, skipping.');
    return;
  }

  await db.insert(worldState).values({
    id: 1,
    currentTick: 0,
    worldYear: 0,
    isPaused: false,
  });

  console.log('worldState seeded: tick 0, year 0, unpaused.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
