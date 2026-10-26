# DreamMakerHub Repository Navigation Map

## Overview
This is a monorepo for DreamMakerHub - a platform combining web apps, mobile apps, 3D engines, AI modules, and infrastructure for WonderSpace/WonderPlay experiences.

---

## Top-Level Structure

```
dreammakerhub.website/
├── apps/              # Main applications (web + mobile)
├── packages/          # Shared packages & libraries
├── config/            # Configuration (AI, LiteLLM)
├── docs/              # Documentation (architecture, ops, research)
├── scripts/           # Build, deploy, sync, and utility scripts
├── infra/             # Infrastructure as code (K8s, Supabase, Coder)
├── deploy/            # Deployment scripts for cloud providers
├── engine/            # Core 3D engine (PlayCanvas-based)
├── services/          # Backend services
├── supabase/          # Supabase configuration & migrations
├── templates/         # Project/feature templates
├── tests/             # Integration & E2E tests
├── agent/             # AI agent configurations
├── content/           # Content assets
├── public/            # Static public assets
├── lib/               # Shared utilities
├── types/             # TypeScript type definitions
├── prisma/            # Database schema
├── custom-engine/     # Custom rendering engine experiments
├── spatial-platform/  # Spatial computing platform
├── wp-content/        # WordPress content
├── coder/             # Coder workspace templates
├── runners/           # CI/CD runners
├── ai-wonderland-training/  # AI training data
├── my-agent/          # Custom agent
├── attached_assets/   # Attached assets
├── bin/               # Binary executables
├── notes/             # Developer notes
├── .github/           # GitHub workflows
├── .devcontainer/     # Dev container config
├── .idx/              # IDX configuration
├── .vscode/           # VS Code settings
├── .opencode/         # OpenCode configuration
```

---

## Applications (`apps/`)

### `apps/web/` - Next.js Web Application
```
apps/web/
├── app/                    # Next.js App Router pages
├── components/             # React components (UI, forms, layouts)
├── core/                   # Core utilities, hooks, context
├── data/                   # Data fetching, API clients
├── lib/                    # Shared libraries, utilities
├── services/               # Frontend services (auth, billing, etc.)
├── styles/                 # Global styles, Tailwind config
├── utils/                  # Helper functions
├── middleware/             # Next.js middleware
├── runners/                # Test runners
├── scripts/                # Web-specific scripts
├── public/                 # Static assets
├── ai-modules/             # AI-powered modules
├── infra/                  # Web infra configs
├── types/                  # Web-specific types
└── Configuration files:
    ├── next.config.mjs
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── package.json
    └── Dockerfile.webapp
```

### `apps/mobile/` - React Native / Expo Mobile App
```
apps/mobile/
├── app/              # Expo Router screens
├── components/       # Mobile UI components
├── constants/        # App constants
├── lib/              # Mobile utilities
└── Configuration:
    ├── app.json
    ├── eas.json
    └── package.json
```

---

## Shared Packages (`packages/`)

| Package | Purpose |
|---------|---------|
| `engine-core` | Core 3D engine (PlayCanvas wrapper, scene management) |
| `shared` | Shared utilities, types, constants across apps |
| `wonder-runtime` | WonderSpace runtime for 3D experiences |
| `gesture-engine` | Gesture recognition for spatial interactions |
| `ide-engine` | IDE-like editing capabilities |
| `optimizer` | Performance optimization utilities |
| `perf-assets` | Performance-focused asset handling |
| `playground-sync` | Real-time collaboration sync |
| `truthshield` | Content moderation / safety |
| `aiw-cli` | AI Wonderland CLI tools |
| `coder-workspace` | Coder workspace templates & configs |

---

## Infrastructure (`infra/`)

```
infra/
├── coder/           # Coder Kubernetes templates & configs
├── services/        # Infrastructure services
├── supabase/        # Supabase project config, migrations
├── wonder-runtime/  # WonderSpace runtime infra
├── wonderspace/     # WonderSpace platform infra
├── optimizer/       # Optimization infrastructure
└── lib/             # Shared infra libraries
```

---

## Deployment (`deploy/`)

```
deploy/
├── aws/             # AWS EKS deployment
├── aws-fallback/    # AWS fallback configs
├── civo/            # Civo Kubernetes deployment
├── hostbrr/         # HostBRR deployment
├── upcloud/         # UpCloud deployment
├── k8s/             # Kubernetes manifests
├── deploy.sh        # Main deployment script
└── setup-website.sh # Website setup script
```

---

## Core Engine (`engine/`)

```
engine/
└── core/            # PlayCanvas-based 3D engine core
    ├── src/         # Engine source code
    ├── scenes/      # Scene definitions
    ├── systems/     # ECS systems
    └── components/  # Engine components
```

---

## Documentation (`docs/`)

```
docs/
├── operations/          # Operational runbooks (Coder, AWS, billing)
├── research/            # Research findings (dated)
├── blueprints/          # Architecture blueprints
├── reference/           # Reference images
├── security/            # Security audits
├── openapi.yaml         # API specification
├── index.mdx            # Documentation homepage
├── *.mdx                # Feature documentation
└── *.md                 # Architecture & planning docs
```

Key docs:
- `360_VR_AI_Architecture.md` - VR/AR architecture
- `wonderspace-supabase-backend.md` - Backend design
- `WONDERSPACE_CODER_SUPABASE_CONSOLIDATION.md` - Integration plan
- `COST_GUARD_ROLLOUT.md` - Cost management
- `CODER_CUSTOMER_PILOT_RUNBOOK.md` - Customer onboarding

---

## Scripts (`scripts/`)

### Build & Typecheck
- `build-linux.sh` - Linux build script
- `typecheck/check.mjs` - TypeScript type checking
- `typecheck/known-diagnostics.json` - Known TS errors

### Sync & Assets
- `sync-assets.ts` / `sync-assets.mjs` - Asset synchronization
- `sync-guides.sh` - Guide synchronization
- `sync-cron.sh` - Cron job for syncing
- `split-builder-renderers.mjs` - Code splitting
- `split-builder-blocks.mjs` - Block splitting

### Billing & Payments
- `billing/check-account-trial-migration.mjs` - Trial migration

### Security
- `security/check-dependency-remediation.mjs` - Dependency scanning
- `no-placeholders.sh` - Placeholder detection

### Development
- `devtool.sh` - Development tooling
- `smoke.sh` - Smoke tests
- `start-all.sh` - Start all services
- `start-playcanvas-isolation.sh` - PlayCanvas isolation
- `test-ai-implementation.sh` - AI testing
- `verify-npc-preview-model.mjs` - NPC model verification
- `wonder-key.mjs` - Wonder API key management

### Registry
- `registry/sync-assets.mjs` - Registry asset sync

### Swarm (Parallel Processing)
- `swarm/run-phase-workers.mjs` - Phase workers
- `swarm/run-unreal-stack.mjs` - Unreal Engine stack

### Utilities
- `fix-imports.sh` - Import fixing
- `fix-renderers.cjs` - Renderer fixes
- `generate-tree-directories.sh` - Directory tree generation
- `update-readme.sh` - README updates
- `kubeconfig-setup.sh` - Kubeconfig setup
- `release-gates-check.sh` - Release validation
- `install_deps.sh` - Dependency installation
- `check-wonderplay.sh` - WonderPlay verification
- `stripe-seed-saas-plan.ts` - Stripe plan seeding

---

## Supabase (`supabase/`)

Database schema, migrations, edge functions, and local development config.

---

## Templates (`templates/`)

Project templates for new features, components, and workspace setups.

---

## Tests (`tests/`)

Integration and E2E tests:
- `checkout-pricing-contract.test.ts` - Billing tests
- `dashboard-code-tools-separation.test.ts` - Dashboard tools
- `same-page-billing.test.ts` - Billing flow
- `wonderbuild-ai-generator-modal.test.tsx` - AI generator
- `coder-customer-open.test.ts` - Coder workspace
- `wonderspace-browser-launch.test.ts` - Browser launch

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace dependencies |
| `tsconfig.base.json` | Base TypeScript config |
| `tsconfig.json` | Root TS config |
| `tsconfig.docs.json` | Docs TS config |
| `eslint.config.js` | ESLint configuration |
| `prettier.config.js` | Prettier configuration |
| `vitest.config.ts` | Vitest configuration |
| `typedoc.json` | TypeDoc configuration |
| `components.json` | Component registry |
| `registry.json` | Package registry |
| `openapi.yaml` | OpenAPI spec |
| `config.yaml` | App configuration |
| `app.json` | Expo app config |
| `eas.json` | Expo Application Services |
| `ecosystem.config.cjs` | PM2 ecosystem |
| `railway.json` | Railway deployment |
| `docker.md` | Docker documentation |
| `Dockerfile` | Root Dockerfile |
| `workspace-runtime.Dockerfile` | Runtime Dockerfile |
| `.env.example` | Environment variables template |
| `.gitignore` | Git ignore rules |
| `.npmrc` | NPM configuration |
| `.node-version` | Node version |
| `.nvmrc` | NVM version |
| `Makefile` | Make commands |
| `CHANGELOG.md` | Change log |
| `TODO.md` / `todo.md` | Task tracking |

---

## Quick Navigation Commands

```bash
# Web app
cd apps/web

# Mobile app
cd apps/mobile

# Shared packages
cd packages/engine-core
cd packages/shared

# Infrastructure
cd infra/coder
cd infra/supabase

# Documentation
cd docs/operations
cd docs/research

# Scripts
cd scripts

# Deployment
cd deploy/civo
deploy/k8s

# Engine
cd engine/core

# Tests
cd tests
```

---

## Key Entry Points

| Task | Entry Point |
|------|-------------|
| Start web dev | `cd apps/web && npm run dev` |
| Start mobile | `cd apps/mobile && npm start` |
| Run tests | `npm test` or `cd tests && npm test` |
| Typecheck | `node scripts/typecheck/check.mjs` |
| Build all | `./scripts/build-linux.sh` |
| Deploy to Civo | `cd deploy/civo && ./deploy.sh` |
| Sync assets | `node scripts/sync-assets.mjs` |
| Check billing | `node scripts/billing/check-account-trial-migration.mjs` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER FACING                          │
├─────────────────────┬───────────────────────────────────────┤
│   apps/web          │   apps/mobile                         │
│   (Next.js)         │   (Expo/React Native)                 │
└─────────┬───────────┴─────────────┬─────────────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      SHARED LAYER                           │
├─────────────────────────────────────────────────────────────┤
│ packages/shared, packages/engine-core, packages/wonder-runtime│
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      ENGINE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│ engine/core (PlayCanvas), packages/gesture-engine,          │
│ packages/ide-engine, packages/optimizer                     │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────┤
│ infra/coder, infra/supabase, infra/wonderspace,             │
│ deploy/{aws,civo,k8s}, supabase/                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Contributing

See `CONTRIBUTING.md` for contribution guidelines.

## Security

See `SECURITY.md` for security policies and `docs/security/` for audits.

---

*Generated on 2026-10-25 - Update this map as the repo evolves*