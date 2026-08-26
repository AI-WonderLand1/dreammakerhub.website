# NPC Civilization Sim — Consolidated Plan

## Status: Most phases implemented

---

## Phase 1: Data Model ✅ DONE
- [x] **NPC table** (`npcs`) — `id, name, hunger, social, stress, traits, tribeId, beliefId, status, age, createdAtTick, memoryRefId`
- [x] **Relationship table** (`relationships`) — `id, npcIdA, npcIdB, score, type, lastInteractionTick`
- [x] **Group tables** (`tribes`, `religions`) — tribes with techLevel, militaryStrength; religions with doctrine, followerCount
- [x] **Event log** (`events`) — `id, tick, type, actorId, targetId, description`
- [x] **Drizzle schema** — npcs, relationships, events, worldState tables in existing Turso/libsql schema

## Phase 2: Tick Loop ✅ DONE
- [x] `tick()` function — batch fetch, decay, decide, resolve, batch write
- [x] Decay rates: hunger +2, social +1.5, stress +1 per tick
- [x] Action effects: eat, socialize, rest, work, flee, idle with defined deltas
- [x] Driver: API endpoint + manual step via `POST /api/tick`
- [x] Speed control via isPaused flag
- [x] Single transaction batch write at tick end
- [x] worldState as single source of truth for currentTick

## Phase 3: Decision Layer ✅ DONE
- [x] Utility AI scoring (eat, socialize, rest, work, flee)
- [x] Random jitter (+/- 5) to scores
- [x] LLM-driven decisions for named NPCs (Anthropic Claude Haiku)
- [x] Hybrid rule: LLM for leaders/named, Utility AI for others
- [x] Structured JSON output from LLM with validation + fallback
- [x] Batch processing per tick

## Phase 4: Relationships & Social Graph ✅ DONE
- [x] Interaction score updates (socialize: +3, conflict: -10, gift: +5, betray: -20)
- [x] Score decay (slow exponential: 0.999 per tick)
- [x] Ordered pair storage (A < B to prevent duplicates)
- [x] Composite unique index
- [x] Behavior modifiers via utility AI multipliers

## Phase 5: Group Identity (Tribes/Religions) ✅ DONE
- [x] Join logic based on relationship thresholds
- [x] Founding logic for high-ambition unaffiliated NPCs
- [x] Aggregate stat queries (population, avgStress by tribe)
- [x] Structured types and group management in tribe-groups.ts

## Phase 6: Persistence ✅ DONE
- [x] Batch write pattern (single Drizzle transaction per tick)
- [x] Selective Mem0 writes for significant events only
- [x] State snapshots via worldState table

## Phase 7: Visualization 🔲 NOT STARTED
- [ ] d3.js force-directed graph (nodes = NPCs, edges = relationships)
- [ ] Canvas rendering fallback for 100+ NPCs
- [ ] World summary panel (aggregate queries in table)
- [ ] Event feed (paginated, ORDER BY tick DESC)

## Phase 8: Stretch 🔲 NOT STARTED
- [ ] Market system (price = basePrice * demand/supply)
- [ ] War resolution (militaryStrength comparison + random factor)
- [ ] Tech tree (population/techLevel gates, chance per tick)

## Implementation Details (from architecture doc)

### Tick Function Shape
```
tick() → fetch alive NPCs → decay needs in memory → decide actions → resolve actions → batch write → increment world tick
```

### Utility AI Formula
```
score(eat)  = hunger × 1.0 + jitter
score(socialize) = social × 0.8 + jitter
score(rest) = stress × 0.9 + jitter
score(work) = (100 - hunger) × 0.3 + ambition × 0.2 + jitter
score(flee) = stress > 80 ? stress × 1.5 + jitter : 0
```

### LLM Budget
- Max 5 LLM calls per tick regardless of NPC count
- Named/key NPCs only (Alice, Rick, leaders)
- Fall back to Utility AI if LLM fails/returns invalid JSON

### Architecture Notes
- Start with utility AI only before adding LLM calls
- Test with 10-20 NPCs before scaling up
- Relationship complexity grows O(n²) — handle sparsely
