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

## Disk Space Status
- Before: 69% full (6.3G free)
- After: 69% full
- No significant change

---

## Known Issues (Pre-existing)
- `SpiritGuide.tsx` - Missing `@lib/agents` module
- `orchestrator.ts` - Argument count mismatch
- `agent/route.ts` - userPrompt property issue

These were pre-existing issues, not from the merge.
