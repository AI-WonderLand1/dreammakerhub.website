# WonderSpace — Agent Instructions

## Quick Commands

```bash
# Dev server (runs ai-wonder-web workspace on :3000)
npm run dev

# Build all workspaces
npm run build

# Tests (vitest)
npm test
npm run test:watch

# Lint + typecheck
npm run lint
npx ts-prune          # find unused exports

# Release gates (automated + manual checklist)
bash scripts/release-gates-check.sh
```

## Monorepo Structure

Workspaces defined in root `package.json`:

```
apps/
  web/                    → Next.js 16 app (pages, API routes)
    - Dev: localhost:3000
    - Prod start: port 5000, host 0.0.0.0
    
packages/
  ide-engine/             → WebContainer-based browser IDE
  optimizer/              → 3D asset optimization server (Fastify)
  perf-assets/            → 3D scene performance profiling
  wonder-runtime/         → GLTF transformation server (Fastify)

engine/core/              → AI providers, IDE runtime, orchestration
runners/                  → Background workers (aiWorker, authWorker)
infra/coder/              → Terraform template + K8s manifests for OKE
infra/lib/                → Shared infra utilities (env, logger, supabase)
infra/services/           → Backend service K8s manifests
infra/optimizer/          → Optimizer K8s manifests
infra/wonder-runtime/     → Wonder Runtime K8s manifests
infra/wonderplay/         → Wonder Play K8s manifests
config/ai/                → System prompts, constitution
agent/                    → Python FastAPI backend (Alice agent)
```

## Path Aliases (tsconfig.base.json)

- `@engine/*` → `engine/*`
- `@ui/*` → `ui/*`
- `@core/*` → `engine/core/*`
- `@components/*` → `ui/components/*`
- `@infra/*` → `infra/*`
- `@lib/*` → `apps/web/lib/*`
- `@types/*` → `types/*`
- `@runners/*` → `runners/*`
- `@config/*` → `config/*`
- `@/lib/*` → `apps/web/lib/*`
- `@/types/*` → `apps/web/types/*`

## Environment Setup

Copy `.env.example` → `.env`:

```bash
# Required
OPENCODE_API_KEY=op-xxx          # Your AI access key (secret)

# For local dev
CODER_ACCESS_URL=http://localhost:7080
ENABLE_TLS=false

# For production
DOMAIN=ide.yourcompany.com
ENABLE_TLS=true
CODER_WILDCARD_ACCESS_URL=*.ide.yourcompany.com
```

## Testing

- Framework: **vitest**
- Tests live in `tests/` at project root
- CI runs: `npm test` (vitest run)

## Release Gates (Production Deployments)

GitLab CI pipeline stages: `test` → `release-gates` → `secret-detection` → `deploy`

Required before production:

1. **Automated**: `bash scripts/release-gates-check.sh`
   - Runs vitest on: tests/
   - All tests must pass before proceeding

2. **Manual checklist**: See `docs/release-gates.md`
   - Auth flows (signup/login/logout/password reset)
   - Project CRUD operations
   - Artifact upload/list/download

3. **Approval**: Trigger `release_gates_manual` and `production_deploy_approval` jobs in GitLab

## Build & Deploy

**Self-hosted only** — no Vercel deployment:

```bash
# Build web app (used in CI)
npm run build --workspace=apps/web

# Deploy to OKE (Oracle Kubernetes)
# See: docs/guides/oracle-no-vercel-deployment.md
```

## Key Tech Stack Notes

- **Framework**: Next.js 16 + React 19 + TypeScript 6
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Auth**: Supabase Auth (@supabase/ssr)
- **3D**: PlayCanvas, Three.js (@react-three/fiber), Theatre.js
- **AI**: OpenRouter, Groq, GitHub Models, Cerebras
- **Editor**: Puck (drag-and-drop), Monaco Editor
- **Infra**: OCI Kubernetes (OKE), Coder v2.32.0
- **WebContainer**: Browser IDE runtime (@webcontainer/api)

## Linting

```bash
npm run lint          # ESLint with --fix
npm run clean:ghosts  # ts-prune + lint (find dead code)
```

ESLint config: `@eslint/js` + `typescript-eslint` (flat config)

## Common Gotchas

- **Node version**: Use Node 20 (specified in CI)
- **Package manager**: npm with workspaces (not pnpm/yarn at root level, though CI uses pnpm for release gates)
- **Dev server**: Custom script at `apps/web/scripts/run-dev.mjs`
- **Port conflicts**: Web app runs on :3000 dev, :5000 prod
- **Import paths**: Use path aliases from `tsconfig.base.json`; avoid relative `../../../` imports

## File Ownership

| Area | Key Files |
|------|-----------|
| AI/Routing | `engine/core/alice-proxy.ts`, `engine/core/syncGuard.ts` |
| Memory | `engine/core/local-memory.ts`, `agent/` (Python FastAPI) |
| Auth | `runners/authWorker/`, Supabase client in `apps/web/` |
| IDE | `packages/ide-engine/`, `agent/` |
| 3D Engine | `engine/core/` + `packages/optimizer/` |
| Optimizer | `packages/optimizer/`, `packages/perf-assets/` |
| Wonder Runtime | `packages/wonder-runtime/` |
| Infra/K8s | `infra/coder/`, `infra/*/`, `Makefile` (Helm for external-secrets) |

## CI/CD

- **GitHub Actions**: `.github/workflows/ci.yml` — runs on push/PR to main
- **GitLab CI**: `.gitlab-ci.yml` — includes SAST, secret detection, release gates
- **Secrets**: Managed via external-secrets operator in K8s (see `Makefile`)

## Documentation

- Full docs: `DOCS.md` (architecture, integrations, deployment, security)
- Release gates: `docs/release-gates.md`
- Architecture plan: `ARCHITECTURE_PLAN.md` (Thin TS / Heavy Python philosophy)
