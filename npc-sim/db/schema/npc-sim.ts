import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// --- NPCs ---
export const npcs = sqliteTable('npcs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  hunger: integer('hunger').notNull().default(0),
  social: integer('social').notNull().default(0),
  stress: integer('stress').notNull().default(0),
  traits: text('traits', { mode: 'json' })
    .notNull()
    .$type<{ aggression: number; sociability: number; ambition: number }>(),
  tribeId: text('tribe_id'),
  beliefId: text('belief_id'),
  status: text('status', { enum: ['alive', 'dead'] }).notNull().default('alive'),
  age: integer('age').notNull().default(0),
  createdAtTick: integer('created_at_tick').notNull().default(0),
  // Points at your existing Mem0-backed memoryRefs table — don't duplicate memory storage here
  memoryRefId: text('memory_ref_id'),
});

// --- Relationships (sparse edge list, not NxN matrix) ---
export const relationships = sqliteTable(
  'relationships',
  {
    id: text('id').primaryKey(),
    npcIdA: text('npc_id_a').notNull(),
    npcIdB: text('npc_id_b').notNull(),
    score: integer('score').notNull().default(0), // -100 (rival) to 100 (ally)
    type: text('type', {
      enum: ['family', 'ally', 'rival', 'romantic', 'neutral'],
    })
      .notNull()
      .default('neutral'),
    lastInteractionTick: integer('last_interaction_tick').notNull().default(0),
  },
  (table) => ({
    // Always insert with npcIdA < npcIdB (see orderedPair() in lib/sim/relationships.ts)
    // to prevent duplicate (A,B)/(B,A) edges
    uniquePair: uniqueIndex('relationships_unique_pair').on(table.npcIdA, table.npcIdB),
  })
);

// --- Groups ---
export const tribes = sqliteTable('tribes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  techLevel: integer('tech_level').notNull().default(0),
  militaryStrength: integer('military_strength').notNull().default(0),
  founderId: text('founder_id'),
  foundedAtTick: integer('founded_at_tick').notNull().default(0),
});

export const religions = sqliteTable('religions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  doctrine: text('doctrine'),
  foundedAtTick: integer('founded_at_tick').notNull().default(0),
});

// --- Event log (append-only) ---
export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    tick: integer('tick').notNull(),
    type: text('type', {
      enum: ['birth', 'death', 'war', 'alliance', 'conversion', 'innovation', 'dialogue'],
    }).notNull(),
    actorId: text('actor_id'),
    targetId: text('target_id'),
    description: text('description').notNull(),
  },
  (table) => ({
    tickIdx: index('events_tick_idx').on(table.tick),
  })
);

// --- Global sim clock (single row) ---
export const worldState = sqliteTable('world_state', {
  id: integer('id').primaryKey().default(1),
  currentTick: integer('current_tick').notNull().default(0),
  worldYear: integer('world_year').notNull().default(0),
  isPaused: integer('is_paused', { mode: 'boolean' }).notNull().default(false),
});
