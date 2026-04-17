# AI Project Merge Plan: wonderland-agents + Simple-Rick-Ai-1

## Project Overview

| Repository | Stack | Type |
|------------|-------|------|
| wonderland-agents | Python, MeTTa, Gemini SDK | AI Agent Logic |
| Simple-Rick-Ai-1 | TypeScript, Vite, Gemini API | Web Frontend |

## Current Structure

### wonderland-agents
- `Alice.py` - Main AI agent entry point (MeTTa logic engine + Gemini client)
- `core/` - Core modules (alice.py, memory_bank.py, neurolink.py, repo_analyzer.py, api_keys.py)
- `api/` - API layer
- `config.py` - Configuration
- `requirements.txt` - Python dependencies
- `venv/` - Virtual environment

### Simple-Rick-Ai-1
- `server.ts` - Express/Node server
- `src/` - Frontend source
- `index.html` - Entry HTML
- `package.json` - Dependencies
- Firebase configuration files
- Vite + TypeScript build setup

## Merge Strategy

### Recommended: Monorepo Structure

```
merged-project/
├── frontend/          # Simple-Rick-Ai-1 (TypeScript)
├── agent/             # wonderland-agents (Python)
└── package.json
```

### Option 1: Python API Backend
- Move `wonderland-agents` to `backend/` folder
- Expose agent logic via FastAPI/Flask
- Call backend API from TypeScript frontend
- **Pros**: Clean separation, scalable, can deploy independently
- **Cons**: Requires API integration work

### Option 2: Separate Workspaces
- Keep as sibling folders under monorepo
- Add root `package.json` with workspace scripts
- **Pros**: Minimal changes, keeps projects separate
- **Cons**: Duplicated Gemini API logic

## Integration Points

1. **Shared API Key**: Consolidate `api_keys.py` with frontend `.env`
2. **Agent Communication**: Frontend calls Python backend via REST API
3. **Memory Bank**: Expose `memory_bank.py` as API endpoints
4. **Alice Agent**: Wrap `ask_alice()` as POST endpoint

## Next Steps

1. Choose merge strategy (Option 1 or 2)
2. Set up monorepo structure
3. Create Python API layer for wonderland-agents
4. Update frontend to call backend API
5. Consolidate configuration and API keys
