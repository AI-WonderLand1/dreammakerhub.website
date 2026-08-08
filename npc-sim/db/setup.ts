import { db } from '@/db';
import { npcs, relationships, tribes, religions, events, worldState } from './schema/npc-sim';

async function setup() {
  console.log('Setting up NPC Sim database...');

  // Create tables using raw SQL (Drizzle doesn't auto-migrate)
  const client = db as any;

  await client.run(`
    CREATE TABLE IF NOT EXISTS npcs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hunger INTEGER NOT NULL DEFAULT 0,
      social INTEGER NOT NULL DEFAULT 0,
      stress INTEGER NOT NULL DEFAULT 0,
      traits TEXT NOT NULL,
      tribe_id TEXT,
      belief_id TEXT,
      status TEXT NOT NULL DEFAULT 'alive',
      age INTEGER NOT NULL DEFAULT 0,
      created_at_tick INTEGER NOT NULL DEFAULT 0,
      memory_ref_id TEXT
    )
  `);

  await client.run(`
    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      npc_id_a TEXT NOT NULL,
      npc_id_b TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'neutral',
      last_interaction_tick INTEGER NOT NULL DEFAULT 0,
      UNIQUE(npc_id_a, npc_id_b)
    )
  `);

  await client.run(`
    CREATE TABLE IF NOT EXISTS tribes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tech_level INTEGER NOT NULL DEFAULT 0,
      military_strength INTEGER NOT NULL DEFAULT 0,
      founder_id TEXT,
      founded_at_tick INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.run(`
    CREATE TABLE IF NOT EXISTS religions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      doctrine TEXT,
      founded_at_tick INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      tick INTEGER NOT NULL,
      type TEXT NOT NULL,
      actor_id TEXT,
      target_id TEXT,
      description TEXT NOT NULL
    )
  `);

  await client.run(`
    CREATE INDEX IF NOT EXISTS events_tick_idx ON events(tick)
  `);

  await client.run(`
    CREATE TABLE IF NOT EXISTS world_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      current_tick INTEGER NOT NULL DEFAULT 0,
      world_year INTEGER NOT NULL DEFAULT 0,
      is_paused INTEGER NOT NULL DEFAULT 0
    )
  `);

  console.log('Database tables created successfully!');
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
