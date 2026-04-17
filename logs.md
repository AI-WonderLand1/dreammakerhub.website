# Merge Log: wonderland-agents + Simple-Rick-Ai-1 → psychic-octo-fishstick

## Date: 2026-04-16

## Goal
Create unique AI personas: **Spirit Guide** (wisdom/intuition) and **Orchestrator** (execution/coordination)

## Source Repos
- `/home/wonderingtribe/wonderland-agents` - Python AI with MeTTa logic engine
- `/home/wonderingtribe/Simple-Rick-Ai-1` - TypeScript frontend (skipped Firebase files)

## Target
`/home/wonderingtribe/psychic-octo-fishstick`

---

## Files Created

### Python Agent Module (`agent/`)
```
agent/
├── core/
│   ├── alice.py          # Main AI agent class
│   ├── memory_bank.py     # SQLite memory storage
│   ├── neurolink.py       # Neural concept linking
│   ├── repo_analyzer.py   # Codebase analysis
│   ├── api_keys.py        # API key management
│   └── __init__.py
├── personas/
│   ├── spirit_guide/      # Wisdom-focused persona
│   │   └── __init__.py
│   ├── orchestrator/     # Execution-focused persona
│   │   └── __init__.py
│   └── __init__.py
├── api/
│   └── main.py            # FastAPI server
├── config.py              # Configuration
├── requirements.txt       # Python dependencies
├── run.sh                 # Startup script
└── Alice.py               # Standalone entry point
```

### Frontend Integration
- `apps/web/app/agent-playground/page.tsx` - AI Playground UI
- `apps/web/app/api/agent/playground/route.ts` - API route for personas
- Updated `engine/core/ai/personas.ts` - Added spirit_guide and orchestrator

---

## API Endpoints
| Method | Endpoint | Persona | Description |
|--------|----------|---------|-------------|
| POST | `/api/spirit-guide/consult` | Spirit Guide | Ask for guidance |
| POST | `/api/orchestrator/execute` | Orchestrator | Execute mission |
| POST | `/api/orchestrator/analyze` | Orchestrator | Analyze repo |
| GET | `/api/orchestrator/status` | Orchestrator | Get status |
| POST | `/api/keys/create` | - | Create API key |
| GET | `/health` | - | Health check |

---

## Playground Access
- URL: `/agent-playground`
- Personas: Spirit Guide 🔮, Orchestrator ⚡
- Features: Train & interact with each persona

---

## Setup Instructions

### 1. Start Python Agent Server
```bash
cd agent
export GEMINI_API_KEY="your-key-here"
./run.sh
```

### 2. Environment Variables
```env
# In your .env.local
GEMINI_API_KEY=your-key-here
AGENT_API_URL=http://localhost:8000
AGENT_API_KEY=  # Optional, for auth
```

### 3. Access Playground
- Go to `/agent-playground` in your app

---

## Files Skipped
- Firebase files (Supabase already in repo)
- `venv/` (create fresh with `run.sh`)

---

## BUILD LOG - Thin TS / Heavy Python Architecture

### Date: 2026-04-16 (Continued)

### Philosophy
- TypeScript = Nervous System (UI, IndexedDB, orchestration)
- Python = Deep Brain (Memory, Analysis, Personas)

### Files Created

#### 1. engine/core/alice-proxy.ts
- **Purpose**: TypeScript wrapper for Python FastAPI
- **Role**: "Remote Brain" interface
- **Methods**:
  - `consult(question)` → Spirit Guide
  - `execute(goal)` → Orchestrator
  - `analyzeRepo(path)` → Repo analysis
  - `storeMemory()` / `recallMemory()` → Memory ops
  - `isOnline()` → Health check
- **Usage**: Import and call like local functions

#### 2. engine/core/local-memory.ts
- **Purpose**: IndexedDB service for short-term session state
- **Role**: "Short-term Memory" (instant, browser-local)
- **Stores**:
  - `thoughts` - AI conversation context
  - `pendingChanges` - Code edits, configs
  - `syncQueue` - Items pending Python sync
- **Methods**:
  - `saveThought()`, `getThoughts()`
  - `savePendingChange()`, `getUnsyncedChanges()`
  - `markSynced()`, `cleanup()`

#### 3. engine/core/syncGuard.ts
- **Purpose**: Batches memory writes to Python
- **Role**: "Shadow Sync" (IndexedDB → Python)
- **Config**:
  - `batchSize: 5` - Sync after 5 items
  - `syncIntervalMs: 30000` - Or every 30 seconds
- **Methods**:
  - `start()`, `stop()`
  - `queueThought()`, `queueChange()`
  - `forceSync()`, `getPendingCount()`

### Data Flow
```
Browser Action
     ↓
IndexedDB (instant save) ← localMemory
     ↓
SyncGuard (batches)
     ↓
Python Memory Bank (persistent)
```

### Usage Example
```typescript
import { alice } from '@/core/alice-proxy';
import { syncGuard } from '@/core/syncGuard';
import { localMemory } from '@/core/local-memory';

// Start sync guard on app init
await syncGuard.start();

// User chats with Spirit Guide
const wisdom = await alice.consult("What path should I take?");
// Also save locally for instant recall
await syncGuard.queueThought("User asked about paths", "spirit_guide");

// Check pending syncs
const pending = await syncGuard.getPendingCount();
console.log(`${pending.thoughts} thoughts, ${pending.changes} changes pending sync`);
```

### Disk Space
- Before: 69% (6.3G free)
- After: 70% (6.1G free)
- Change: +1% used (small footprint, TS files only)

---

## Known Issues (Pre-existing)
- `SpiritGuide.tsx` - Missing `@lib/agents` module
- `orchestrator.ts` - Argument count mismatch
- `agent/route.ts` - userPrompt property issue

These were pre-existing issues, not from the merge.


## Repo Review Report (2026-04-17)

### Scope
- Reviewed `TODO.md` and previous merge notes.
- Verified presence of key files/endpoints referenced by TODO and merge notes.

### Findings
1. **Coder link task appears already implemented in code**
   - `apps/web/app/ide/page.tsx` includes a Coder card and direct links to `https://coder.dreammakerhub.website`.
2. **Persona core is already present**
   - `engine/core/ai/personas.ts` contains `rick`, `spirit_guide`, and `orchestrator` prompts plus AI laws.
   - `/agent-playground` UI and `/api/agent/playground` route are present.
3. **Open work remains**
   - TODO still lists unresolved items for workspace isolation, custom template hardening, confessions system, git panel, temp storage warning, and deploy/preview URLs.
4. **Known issues from merge notes remain listed as pre-existing**
   - `SpiritGuide.tsx` missing module, `orchestrator.ts` arg mismatch, `agent/route.ts` userPrompt issue.

### Suggested Next Actions
1. Update TODO statuses to mark completed items already in code.
2. Prioritize fixing merge-note known issues before net-new features.
3. Implement Confessions System skeleton (types + one pipeline integration).
4. Continue Coder isolation/template hardening work.
