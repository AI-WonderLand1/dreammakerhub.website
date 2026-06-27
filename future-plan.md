# NPC Civilization Sim — Build Checklist

## Phase 1: Data Model

**NPC table** (`npcs`)
- `id`: text/uuid, primary key
- `name`: text
- `hunger`, `social`, `stress`: integer 0–100 (0 = satisfied, 100 = critical) — store as separate columns, not nested JSON, so you can query/sort on them
- `traits`: JSON column — `{ aggression: 0-100, sociability: 0-100, ambition: 0-100 }` (pick 3–5, more is diminishing returns)
- `tribeId`: text, FK → `tribes.id`, nullable
- `beliefId`: text, FK → `religions.id`, nullable
- `status`: enum `'alive' | 'dead'`, default `'alive'`
- `age`: integer (in ticks or years, your call — pick one unit and stay consistent)
- `createdAtTick`: integer — when they were "born" in sim-time, not wall-clock time
- `memoryRefId`: text, FK → your existing Mem0-backed `memoryRefs` table (don't duplicate memory storage here)

**Relationship table** (`relationships`) — sparse, not NxN matrix
- `id`: uuid pk
- `npcIdA`, `npcIdB`: text, FK → npcs.id — always store with A < B alphabetically/by id to avoid duplicate (A,B)/(B,A) rows
- `score`: integer -100 to 100 (negative = rival, positive = ally)
- `type`: enum `'family' | 'ally' | 'rival' | 'romantic' | 'neutral'`
- `lastInteractionTick`: integer — needed for decay logic in Phase 4
- Composite unique index on `(npcIdA, npcIdB)` so you can't get duplicate edges

**Group tables** (`tribes`, `religions`) — keep separate tables, don't merge into one generic "groups" table, they have different stat shapes
- `tribes`: `id, name, techLevel (int), militaryStrength (int), founderId, foundedAtTick`
- `religions`: `id, name, doctrine (text, short), followerCount (computed, don't store), foundedAtTick`
- Don't store `memberIds[]` as an array column — derive membership by querying `npcs WHERE tribeId = ?`. Arrays-of-ids get stale fast.

**Event log** (`events`) — append-only, no updates/deletes
- `id`: uuid pk
- `tick`: integer, indexed (you'll query "events in range" constantly)
- `type`: enum `'birth' | 'death' | 'war' | 'alliance' | 'conversion' | 'innovation' | 'dialogue'`
- `actorId`: text, FK nullable
- `targetId`: text, FK nullable
- `description`: text — human-readable, this is what renders in the feed
- Index on `tick DESC` for the "most recent first" feed query

**Drizzle specifics**
- Add these to your existing Turso/libsql schema file alongside `personas`/`trainingData`
- Use `integer({ mode: 'timestamp' })` only for wall-clock fields (createdAt audit field) — keep sim-time (`tick`) as a plain integer, never conflate the two
- Add a single `worldState` table with one row: `{ currentTick, worldYear, isPaused }` — this is your global sim clock, don't compute "current tick" from row counts elsewhere

## Phase 2: Tick Loop (the simulation engine)

**The tick function shape**
```
async function tick() {
  const npcs = await getAliveNpcs();      // one query, not N
  for (const npc of npcs) decayNeeds(npc); // mutate in memory first
  for (const npc of npcs) decideAction(npc, npcs); // pure function, returns an action object
  await resolveActions(actions);           // apply effects, write events
  await batchWrite(npcs, events);          // ONE write per tick, not per-npc
  await incrementWorldTick();
}
```

**Decay rates** — pick numbers and write them down so you can tune later:
- hunger: +2 per tick
- social: +1 per tick (slower — loneliness builds gradually)
- stress: +1 per tick baseline, +5 on negative events (death nearby, conflict, rejection)
- Cap all at 100, floor at 0

**Driver choice**
- Dev/demo: `setInterval(tick, 1000)` — 1 tick = 1 second, easy to watch
- Production background sim: cron-style (Railway has cron job support, or a long-running worker process) — 1 tick = whatever maps to your "world year" pacing (e.g. 1 tick = 1 sim-day)
- Manual step: just a button calling `POST /api/tick` once — best for debugging, build this first

**Idempotency/resume**
- `worldState.currentTick` is the single source of truth — read it at tick start, write `currentTick + 1` at tick end, never increment optimistically
- If the process crashes mid-tick, the last `batchWrite` either fully succeeded or didn't — wrap it in a single transaction (Turso/libsql supports this) so you never get half-applied ticks

**Speed control**
- Just a multiplier on the interval delay (`setInterval(tick, 1000 / speedMultiplier)`), or a "ticks per call" param if doing manual stepping (`POST /api/tick { count: 10 }`)
- Add a hard cap (e.g. max 100 ticks per manual call) so a fat-fingered request doesn't lock up the DB

## Phase 3: Decision Layer

**Utility AI scoring** — concrete formula:
```
candidateActions = ['eat', 'socialize', 'rest', 'work', 'flee']

function score(action, npc) {
  switch(action) {
    case 'eat':       return npc.hunger * 1.0
    case 'socialize':  return npc.social * 0.8
    case 'rest':       return npc.stress * 0.9
    case 'work':       return (100 - npc.hunger) * 0.3 + npc.traits.ambition * 0.2
    case 'flee':       return npc.stress > 80 ? npc.stress * 1.5 : 0  // threshold-gated
  }
}
// pick action = max(score) across candidateActions
```
- Tune the weights (1.0, 0.8, 0.9, etc.) empirically — log chosen actions for 50 ticks and eyeball if behavior looks sane
- Add small random jitter (`+/- 5`) to scores so NPCs don't all act in perfect lockstep

**LLM-driven decisions** (named NPCs only — Alice, Rick, etc.)
- Prompt shape: system prompt with NPC personality/traits, user message = `{ currentNeeds, recentMemory (last 5 events), nearbyNpcs }`
- Ask for **structured JSON output**: `{ action: string, dialogue: string | null, targetNpcId: string | null }`
- Use the Anthropic API artifact pattern (or your existing OpenRouter routing) — model: cheap/fast tier for this, not your top-tier model, since it runs every tick
- Validate the JSON response against your action enum before applying — LLMs will occasionally invent actions, fall back to utility AI if parsing fails

**Hybrid rule**
- Named/key NPCs (small fixed list, e.g. Alice + Rick + a handful of "leaders"): LLM call every tick or every N ticks
- Everyone else: utility AI only, always
- Set a hard budget: e.g. max 5 LLM calls per tick regardless of NPC count, to keep cost predictable as population grows

**Batching**
- If you do scale LLM calls to more NPCs later, batch multiple NPCs into one prompt (`Decide actions for these 5 NPCs: ...`) rather than 5 separate API calls — cuts latency and cost

## Phase 4: Relationships & Social Graph

- On interaction: `score += interactionValue` where `interactionValue` depends on action+context (e.g. shared meal = +3, conflict = -10, gift = +5) — keep a small lookup table of interaction types → score deltas, don't hardcode inline everywhere
- Decay: every tick, `score = score * 0.999` (or only decay if `lastInteractionTick` is more than N ticks ago) — slow exponential decay reads more natural than linear
- Clamp score to [-100, 100] after every update
- Behavior modifiers: pass relevant relationship scores into the utility AI scoring as a multiplier — e.g. `score('attack', npc) *= (relationshipScore < -20 ? 1.5 : 0.2)`

## Phase 5: Group Identity (Tribes/Religions)

- Join logic: NPC joins a tribe if average relationship score with current members > threshold (e.g. 20) AND no existing tribe membership
- Founding logic: if an NPC has no tribe and high `ambition` trait + enough nearby unaffiliated NPCs with positive relationships, trigger a "found tribe" event
- Aggregate stats — compute via query, e.g.:
  ```sql
  SELECT tribeId, COUNT(*) as population, AVG(stress) as avgStress
  FROM npcs WHERE tribeId = ? AND status = 'alive'
  GROUP BY tribeId
  ```
- Don't cache these aggregates unless population gets large (1000+) and the query becomes a bottleneck — premature caching here just adds staleness bugs

## Phase 6: Persistence

- Batch write pattern: collect all NPC updates + new events into arrays during the tick, write once via a single Drizzle transaction at tick end
- Mem0 writes: only write to memory for "significant" events (death, conflict, conversion) — not every tick for every NPC, or you'll blow through Mem0 quota/cost fast
- Snapshot: every 100 ticks, write a full state dump to a `snapshots` table (`tick, jsonBlob`) — gives you a rollback point without needing full event replay

## Phase 7: Visualization

- d3.js force-directed graph: nodes = NPCs (color by tribe/religion), edges = relationships (color by type, width = |score|/20)
- Use `d3-force` with `forceLink`, `forceManyBody`, `forceCenter` — standard setup, don't reinvent
- For 100+ NPCs, switch from SVG rendering to canvas (SVG DOM nodes get slow past a few hundred elements)
- World summary panel: just render the Phase 5 aggregate query results in a table
- Event feed: paginated query on `events ORDER BY tick DESC LIMIT 50`

## Phase 8: Stretch

- Market: `price = basePrice * (demand/supply)`, recompute per tick per good, store price history for trend lines
- War resolution: compare aggregate `militaryStrength` between tribes + random factor, weaker side takes population/resource losses
- Tech tree: gate innovations behind `population > X AND techLevel >= Y`, roll a chance per tick once gated

## Notes
- Start with utility AI only — get the tick loop and persistence solid before adding LLM calls.
- Test with a small NPC count (10–20) before scaling up; relationship graph complexity grows O(n²) if not handled sparsely.