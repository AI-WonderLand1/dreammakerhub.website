# NPC Civilization Sim — Build Checklist

## Phase 1: Data Model
- [ ] **NPC table** (`npcs`)
    - [ ] `id`: text/uuid, primary key
    - [ ] `name`: text
    - [ ] `hunger`, `social`, `stress`: integer 0–100
    - [ ] `traits`: JSON column `{ aggression, sociability, ambition }`
    - [ ] `tribeId`: text, FK → `tribes.id`
    - [ ] `beliefId`: text, FK → `religions.id`
    - [ ] `status`: enum `'alive' | 'dead'`
    - [ ] `age`: integer
    - [ ] `createdAtTick`: integer
    - [ ] `memoryRefId`: text, FK → `memoryRefs`
- [ ] **Relationship table** (`relationships`)
    - [ ] `id`: uuid pk
    - [ ] `npcIdA`, `npcIdB`: text, FK → `npcs.id`
    - [ ] `score`: integer -100 to 100
    - [ ] `type`: enum `'family' | 'ally' | 'rival' | 'romantic' | 'neutral'`
    - [ ] `lastInteractionTick`: integer
    - [ ] Composite unique index on `(npcIdA, npcIdB)`
- [ ] **Group tables** (`tribes`, `religions`)
    - [ ] `tribes`: `id, name, techLevel, militaryStrength, founderId, foundedAtTick`
    - [ ] `religions`: `id, name, doctrine, foundedAtTick`
- [ ] **Event log** (`events`)
    - [ ] `id`: uuid pk
    - [ ] `tick`: integer, indexed
    - [ ] `type`: enum `'birth' | 'death' | 'war' | 'alliance' | 'conversion' | 'innovation' | 'dialogue'`
    - [ ] `actorId`: text, FK
    - [ ] `targetId`: text, FK
    - [ ] `description`: text
    - [ ] Index on `tick DESC`
- [ ] **Drizzle specifics**
    - [ ] Add to existing Turso/libsql schema file
    - [ ] `worldState` table: `{ currentTick, worldYear, isPaused }`

## Phase 2: Tick Loop (the simulation engine)
- [ ] Implement `tick()` function
- [ ] Set up decay rates (hunger, social, stress)
- [ ] Implement driver (Dev/demo `setInterval` & manual `POST /api/tick`)
- [ ] Ensure idempotency/resume via `worldState.currentTick`
- [ ] Implement speed control

## Phase 3: Decision Layer
- [ ] Implement Utility AI scoring (eat, socialize, rest, work, flee)
- [ ] Add random jitter to scores
- [ ] Implement LLM-driven decisions for named NPCs
- [ ] Implement Hybrid rule (LLM for leaders, Utility AI for others)
- [ ] Implement decision batching

## Phase 4: Relationships & Social Graph
- [ ] Implement interaction score updates
- [ ] Implement score decay
- [ ] Implement behavior modifiers based on relationships

## Phase 5: Group Identity (Tribes/Religions)
- [ ] Implement join logic
- [ ] Implement founding logic
- [ ] Implement aggregate stat queries

## Phase 6: Persistence
- [ ] Implement batch write pattern (single Drizzle transaction)
- [ ] Implement selective Mem0 writes for significant events
- [ ] Implement state snapshots every 100 ticks

## Phase 7: Visualization
- [ ] Implement d3.js force-directed graph
- [ ] Implement World summary panel
- [ ] Implement Event feed (paginated)

## Phase 8: Stretch
- [ ] Implement Market system
- [ ] Implement War resolution
- [ ] Implement Tech tree
