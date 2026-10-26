# DreamMakerHub Repository - Detailed Connection Map

## Overview
This document shows how each section connects to others - imports, dependencies, data flow, and integration points.

---

## 1. APPLICATIONS LAYER

### `apps/web/` (Next.js 14+ App Router)
**Primary Entry Point:** `apps/web/app/layout.tsx` → `apps/web/app/page.tsx`

#### Internal Connections (Imports FROM web)
```
apps/web/
├── app/                    # Pages & layouts
│   ├── (auth)/             # Auth routes → lib/auth, services/auth
│   ├── (dashboard)/        # Dashboard → components/dashboard, lib/api
│   ├── (builder)/          # WonderBuild → packages/engine-core, wonder-runtime
│   ├── (play)/             # WonderPlay → packages/wonder-runtime, engine/core
│   ├── api/                # API routes → services/*, supabase, packages/shared
│   └── (marketing)/        # Landing → components/marketing, content/
├── components/
│   ├── ui/                 # Base UI → packages/shared/ui, tailwind
│   ├── forms/              # Forms → react-hook-form, zod (packages/shared/schemas)
│   ├── dashboard/          # Dashboard widgets → services/billing, services/coder
│   ├── builder/            # Builder canvas → packages/engine-core, gesture-engine
│   ├── play/               # Play runtime → packages/wonder-runtime
│   └── three/              # Three.js wrappers → engine/core, packages/perf-assets
├── core/
│   ├── hooks/              # Custom hooks → packages/shared/hooks, services/*
│   ├── context/            # React context → packages/shared/state
│   └── utils/              # Helpers → packages/shared/utils
├── lib/
│   ├── api/                # API client → services/*, supabase client
│   ├── auth/               # Auth helpers → packages/shared/auth, next-auth
│   ├── billing/            # Stripe helpers → services/billing, packages/shared/billing
│   ├── coder/              # Coder API → services/coder, infra/coder
│   └── supabase/           # Supabase client → supabase/, packages/shared/supabase
├── services/
│   ├── auth.ts             # → packages/shared/auth, supabase auth
│   ├── billing.ts          # → Stripe, supabase/billing, packages/shared/billing
│   ├── coder.ts            # → infra/coder/templates, Coder API
│   ├── wonderspace.ts      # → packages/wonder-runtime, infra/wonderspace
│   └── ai.ts               # → apps/web/ai-modules, config/ai
├── ai-modules/             # AI features → config/ai, packages/shared/ai
├── styles/                 # → tailwind.config.ts, packages/shared/styles
├── middleware.ts           # → lib/auth, lib/api, next/server
└── Configuration:
    ├── next.config.mjs     # → packages/*, transpilePackages, images
    ├── tsconfig.json       # → tsconfig.base.json, packages/*
    └── package.json        # Dependencies on ALL packages/*
```

#### External Connections (Imports TO web)
| Source | Imports From Web |
|--------|------------------|
| `scripts/sync-assets.mjs` | `apps/web/public/`, `apps/web/components/` |
| `scripts/build-linux.sh` | `apps/web/` build output |
| `deploy/k8s/` | `apps/web/Dockerfile.webapp` |
| `tests/` | `apps/web/app/`, `apps/web/components/` |

---

### `apps/mobile/` (Expo / React Native)
**Primary Entry Point:** `apps/mobile/app/_layout.tsx`

#### Internal Connections
```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/             # → lib/auth, packages/shared/auth
│   ├── (tabs)/             # Main tabs → components/, lib/api
│   ├── builder/            # → packages/engine-core (React Native WebGL)
│   └── play/               # → packages/wonder-runtime (native)
├── components/             # → packages/shared/ui (RN compatible), gesture-engine
├── lib/
│   ├── api.ts              # → services/*, same as web but RN fetch
│   ├── auth.ts             # → packages/shared/auth, expo-secure-store
│   └── supabase.ts         # → @supabase/supabase-js, packages/shared/supabase
└── constants/              # → packages/shared/constants
```

#### Shared with Web
- **Packages:** `packages/shared`, `packages/engine-core`, `packages/wonder-runtime`, `packages/gesture-engine`
- **Types:** `types/`, `packages/shared/types`
- **API Contracts:** `openapi.yaml`, `packages/shared/api-contracts`
- **Supabase:** Same backend, different client config

---

## 2. SHARED PACKAGES LAYER (`packages/`)

### `packages/shared` - **Central Hub** (Most Connected)
```
packages/shared/
├── src/
│   ├── types/              # ← Used by: ALL packages, apps/web, apps/mobile, engine/
│   ├── utils/              # ← Used by: ALL
│   ├── hooks/              # ← Used by: apps/web, apps/mobile, packages/*
│   ├── schemas/            # Zod schemas ← apps/web, apps/mobile, services/
│   ├── constants/          # ← Used by: ALL
│   ├── auth/               # Auth types/helpers ← apps/web, apps/mobile, services/auth
│   ├── billing/            # Billing types ← apps/web, services/billing, scripts/billing
│   ├── supabase/           # Supabase helpers ← apps/web, apps/mobile, services/*, infra/supabase
│   ├── api-contracts/      # API types ← apps/web/api, services/*
│   ├── ai/                 # AI types ← apps/web/ai-modules, config/ai
│   ├── styles/             # Design tokens ← apps/web, apps/mobile, packages/*/ui
│   └── state/              # Zustand/Jotai ← apps/web, apps/mobile
├── package.json            # Deps: zod, zustand, @supabase/supabase-js, date-fns
└── tsconfig.json           # Extends: ../../tsconfig.base.json
```

**Reverse Dependencies (Who imports shared):**
- `apps/web` ✓
- `apps/mobile` ✓
- `packages/engine-core` ✓
- `packages/wonder-runtime` ✓
- `packages/gesture-engine` ✓
- `packages/ide-engine` ✓
- `packages/optimizer` ✓
- `packages/perf-assets` ✓
- `packages/playground-sync` ✓
- `packages/truthshield` ✓
- `packages/aiw-cli` ✓
- `packages/coder-workspace` ✓
- `engine/core` ✓
- `services/*` ✓
- `scripts/*` ✓
- `tests/*` ✓

---

### `packages/engine-core` - **3D Engine Wrapper**
```
packages/engine-core/
├── src/
│   ├── playcanvas/         # PlayCanvas wrapper → engine/core, @playcanvas/pcui
│   ├── scene/              # Scene graph → packages/wonder-runtime, apps/web/builder
│   ├── entities/           # Entity system → packages/wonder-runtime, gesture-engine
│   ├── components/         # Engine components → wonder-runtime, ide-engine
│   ├── systems/            # ECS systems → wonder-runtime, optimizer
│   ├── physics/            # Physics → wonder-runtime, gesture-engine
│   ├── audio/              # Audio → wonder-runtime
│   ├── input/              # Input handling → gesture-engine, apps/web/builder
│   ├── rendering/          # Render pipeline → perf-assets, wonder-runtime
│   └── network/            # Network sync → playground-sync, wonder-runtime
├── package.json            # Deps: @playcanvas/engine, packages/shared
└── tsconfig.json
```

**Connections:**
| Imports From | Exports To |
|--------------|------------|
| `engine/core` (raw PlayCanvas) | `packages/wonder-runtime` |
| `packages/shared` (types, utils) | `apps/web/components/builder` |
| `packages/perf-assets` (assets) | `apps/mobile/app/builder` |
| `packages/gesture-engine` (input) | `packages/ide-engine` |
| | `packages/optimizer` |

---

### `packages/wonder-runtime` - **WonderSpace Runtime**
```
packages/wonder-runtime/
├── src/
│   ├── runtime/            # Core runtime → apps/web/play, apps/mobile/play
│   ├── loader/             # Asset loading → packages/perf-assets, engine/core
│   ├── networking/         # Multiplayer → packages/playground-sync, infra/wonderspace
│   ├── scripting/          # User scripts → packages/ide-engine, truthshield
│   ├── physics/            # Physics sync → engine-core, gesture-engine
│   ├── avatar/             # Avatar system → apps/web/play, apps/mobile/play
│   ├── ui/                 # In-world UI → apps/web/components/play
│   └── analytics/          # Telemetry → services/analytics, infra/wonderspace
├── package.json            # Deps: engine-core, shared, playground-sync, gesture-engine
└── tsconfig.json
```

**Connections:**
| Imports From | Exports To |
|--------------|------------|
| `packages/engine-core` | `apps/web/app/(play)/` |
| `packages/shared` | `apps/mobile/app/(play)/` |
| `packages/playground-sync` | `infra/wonderspace/runtime` |
| `packages/gesture-engine` | `services/wonderspace` |
| `packages/truthshield` | `scripts/wonder-key.mjs` |
| `infra/wonderspace` (config) | |

---

### `packages/gesture-engine` - **Spatial Input**
```
packages/gesture-engine/
├── src/
│   ├── detection/          # Gesture detection → wonder-runtime, engine-core
│   ├── recognition/        # ML models → config/ai, ai-wonderland-training
│   ├── hands/              # Hand tracking → wonder-runtime, apps/web/builder
│   ├── spatial/            # Spatial mapping → wonder-runtime, infra/wonderspace
│   └── input/              # Input abstraction → engine-core, ide-engine
```

**Connections:**
- ← `config/ai` (model configs)
- ← `ai-wonderland-training/` (training data)
- → `packages/wonder-runtime` (avatar/hands)
- → `packages/engine-core` (input system)
- → `apps/web/components/builder` (editor gestures)
- → `apps/mobile` (AR gestures)

---

### `packages/ide-engine` - **Editor/IDE Features**
```
packages/ide-engine/
├── src/
│   ├── editor/             # Code editor → apps/web/builder, coder-workspace
│   ├── filesystem/         # Virtual FS → coder-workspace, infra/coder
│   ├── terminal/           # Terminal → coder-workspace, infra/coder
│   ├── debugging/          # Debug adapter → coder-workspace
│   └── extensions/         # Extension API → coder-workspace, aiw-cli
```

**Connections:**
- ← `packages/coder-workspace` (workspace configs)
- ← `infra/coder` (K8s templates)
- → `apps/web/components/builder` (code editing)
- → `apps/web/ai-modules` (AI code gen)

---

### `packages/optimizer` - **Performance**
```
packages/optimizer/
├── src/
│   ├── bundle/             # Bundle analysis → apps/web, apps/mobile
│   ├── runtime/            # Runtime perf → wonder-runtime, engine-core
│   ├── assets/             # Asset optimization → perf-assets, engine-core
│   └── network/            # Network optimization → playground-sync, wonder-runtime
```

**Connections:**
- → `apps/web/next.config.mjs` (webpack config)
- → `apps/mobile/eas.json` (build optimization)
- → `deploy/k8s/` (resource limits)
- ← `infra/optimizer` (infra-level optimization)

---

### `packages/perf-assets` - **Asset Pipeline**
```
packages/perf-assets/
├── src/
│   ├── compression/        # Texture/mesh compression → engine-core, wonder-runtime
│   ├── streaming/          # Progressive loading → wonder-runtime, apps/web/play
│   ├── cdn/                # CDN integration → infra/wonderspace, deploy/*
│   └── formats/            # Format conversion → engine/core, scripts/sync-assets
```

**Connections:**
- → `engine/core` (asset formats)
- → `packages/wonder-runtime` (loader)
- → `scripts/sync-assets.mjs` (pipeline)
- ← `infra/wonderspace/cdn` (CDN config)

---

### `packages/playground-sync` - **Real-time Sync**
```
packages/playground-sync/
├── src/
│   ├── yjs/                # Yjs provider → wonder-runtime, apps/web/play
│   ├── awareness/          # Presence → wonder-runtime, apps/web/components/play
│   ├── persistence/        # Supabase sync → supabase/, infra/supabase
│   └── conflict/           # Conflict resolution → wonder-runtime, ide-engine
```

**Connections:**
- → `packages/wonder-runtime` (networking)
- → `supabase/` (realtime, persistence)
- → `apps/web/app/(play)/` (multiplayer)
- ← `infra/wonderspace/sync` (server config)

---

### `packages/truthshield` - **Safety/Moderation**
```
packages/truthshield/
├── src/
│   ├── content/            # Content scanning → apps/web/ai-modules, wonder-runtime
│   ├── behavior/           # Behavior analysis → wonder-runtime, services/analytics
│   ├── policy/             # Policy engine → services/billing, coder-workspace
│   └── reporting/          # Reports → services/admin, infra/wonderspace
```

**Connections:**
- → `apps/web/ai-modules` (AI safety)
- → `packages/wonder-runtime` (runtime safety)
- → `services/billing` (fraud detection)
- → `infra/coder` (workspace policies)

---

### `packages/aiw-cli` - **CLI Tools**
```
packages/aiw-cli/
├── src/
│   ├── commands/
│   │   ├── deploy.ts       # → deploy/*, infra/*
│   │   ├── sync.ts         # → scripts/sync-assets, supabase/
│   │   ├── build.ts        # → scripts/build-linux.sh, packages/*
│   │   └── wonder.ts       # → wonder-runtime, infra/wonderspace
│   └── utils/              # → packages/shared
```

**Connections:**
- Orchestrates: `deploy/*`, `scripts/*`, `infra/*`, `supabase/`
- Used by: `scripts/devtool.sh`, `scripts/smoke.sh`, CI/CD

---

### `packages/coder-workspace` - **Coder Templates**
```
packages/coder-workspace/
├── templates/
│   ├── node/               # → infra/coder/templates/node
│   ├── python/             # → infra/coder/templates/python
│   ├── unreal/             # → infra/coder/templates/unreal
│   └── wonder/             # → infra/coder/templates/wonder
├── configs/                # → infra/coder/parameters, .coder/*
└── scripts/                # → scripts/workspace-runtime/*
```

**Connections:**
- → `infra/coder/` (K8s templates, parameters)
- → `deploy/civo/` (Civo-specific)
- → `scripts/workspace-runtime/` (runtime scripts)
- ← `services/coder` (API)

---

## 3. ENGINE LAYER (`engine/`)

### `engine/core/` - **Raw PlayCanvas Engine**
```
engine/core/
├── src/
│   ├── engine/             # Core engine → packages/engine-core
│   ├── graphics/           # WebGL/WebGPU → packages/perf-assets
│   ├── physics/            # Ammo.js → packages/engine-core/physics
│   ├── audio/              # Web Audio → packages/engine-core/audio
│   ├── input/              # Input manager → packages/gesture-engine
│   └── network/            # Networking → packages/playground-sync
├── scenes/                 # Scene files → packages/wonder-runtime/loader
├── scripts/                # Engine scripts → packages/engine-core
└── assets/                 # Engine assets → packages/perf-assets
```

**Key Exports:**
- `@playcanvas/engine` (npm package or local)
- Used by: `packages/engine-core` (wrapper), `custom-engine/` (experiments)

---

## 4. INFRASTRUCTURE LAYER (`infra/`)

### `infra/coder/` - **Coder on Kubernetes**
```
infra/coder/
├── templates/              # Workspace templates ← packages/coder-workspace
├── parameters/             # Template parameters ← packages/coder-workspace
├── k8s/                    # K8s manifests ← deploy/k8s/
├── images/                 # Docker images ← deploy/*/Dockerfile
├── postgres/               # Coder DB ← supabase/ (or separate)
└── timescale/              # Metrics DB ← infra/wonderspace/metering
```

**Connections:**
- ← `packages/coder-workspace` (templates, configs)
- ← `deploy/civo/`, `deploy/aws/`, `deploy/k8s/` (deployment)
- → `services/coder` (API client)
- → `apps/web/services/coder.ts` (web integration)
- ← `scripts/workspace-runtime/` (runtime scripts)

---

### `infra/supabase/` - **Supabase Configuration**
```
infra/supabase/
├── migrations/             # SQL migrations ← supabase/migrations
├── functions/              # Edge functions ← services/*, apps/web/api
├── config.toml             # Local config ← supabase/config.toml
├── seed/                   # Seed data ← scripts/stripe-seed-saas-plan.ts
└── monitoring/             # Metrics → infra/wonderspace/metering
```

**Connections:**
- ← `supabase/` (root supabase folder)
- → `packages/shared/supabase` (client helpers)
- → `apps/web/lib/supabase`, `apps/mobile/lib/supabase`
- → `services/*` (backend services)
- → `packages/playground-sync/persistence` (realtime)

---

### `infra/wonderspace/` - **WonderSpace Platform**
```
infra/wonderspace/
├── runtime/                # Runtime deployment ← packages/wonder-runtime
├── cdn/                    # CDN config ← packages/perf-assets
├── metering/               # Usage metering ← packages/truthshield, billing
├── sync/                   # Sync server ← packages/playground-sync
├── analytics/              # Analytics pipeline ← wonder-runtime, truthshield
├── scaling/                # Auto-scaling ← deploy/k8s/, optimizer
└── security/               # Security policies ← truthshield, coder
```

**Connections:**
- ← `packages/wonder-runtime` (runtime config)
- ← `packages/perf-assets` (CDN)
- ← `packages/playground-sync` (sync server)
- ← `packages/truthshield` (safety)
- → `deploy/k8s/` (K8s manifests)
- → `services/wonderspace` (API)

---

### `infra/services/` - **Shared Infrastructure Services**
```
infra/services/
├── database/               # PostgreSQL/Redis ← supabase/, coder
├── messaging/              # NATS/Kafka ← playground-sync, wonder-runtime
├── monitoring/             # Prometheus/Grafana ← all services
├── logging/                # Loki/ELK ← all services
└── secrets/                # Vault/SealedSecrets ← all deploy/*
```

---

## 5. DEPLOYMENT LAYER (`deploy/`)

### Provider-Specific
```
deploy/
├── civo/                   # Civo K3s
│   ├── k3s-config.yaml     # ← infra/coder/k8s/, infra/wonderspace/k8s/
│   └── deploy.sh           # → scripts/kubeconfig-setup.sh
├── aws/                    # AWS EKS
│   ├── eksctl.yaml         # ← infra/coder/k8s/, infra/wonderspace/k8s/
│   └── iam/                # ← infra/services/secrets/
├── k8s/                    # Shared K8s manifests
│   ├── base/               # ← infra/coder/, infra/wonderspace/, infra/services/
│   ├── overlays/
│   │   ├── dev/            # ← .env.example, config.yaml
│   │   ├── staging/
│   │   └── prod/           # ← secrets, monitoring
│   └── apps/
│       ├── web/            # ← apps/web/Dockerfile.webapp
│       ├── coder/          # ← infra/coder/images/
│       └── wonder-runtime/ # ← packages/wonder-runtime/Dockerfile
├── hostbrr/                # HostBRR bare metal
└── upcloud/                # UpCloud
```

**Flow:**
```
packages/* → Docker images → deploy/k8s/apps/* → deploy/{civo,aws,k8s}/ → Cloud
                    ↑
            infra/* provides manifests
```

---

## 6. SERVICES LAYER (`services/`)

### `services/simplerick/` - **Example Service**
```
services/simplerick/
├── src/
│   ├── api/                # REST API → apps/web/api, apps/mobile/lib/api
│   ├── workers/            # Background jobs → infra/services/messaging
│   ├── database/           # Prisma/SQL → prisma/, supabase/
│   └── events/             # Event handlers → playground-sync, wonder-runtime
```

**Pattern for all services:**
- ← `packages/shared` (types, utils)
- ← `prisma/` (schema)
- ← `supabase/` (edge functions, realtime)
- → `apps/web/services/*.ts` (client)
- → `infra/services/` (deployment)
- → `deploy/k8s/apps/*` (K8s)

---

## 7. SUPABASE LAYER (`supabase/`)

```
supabase/
├── migrations/             # → infra/supabase/migrations, prisma/
├── functions/              # Edge functions → infra/supabase/functions
├── config.toml             # → infra/supabase/config.toml
├── seed.sql                # ← scripts/stripe-seed-saas-plan.ts
└── .branches/              # Branch-specific ← CI/CD
```

**Connections:**
- Schema source of truth for `prisma/schema.prisma`
- Edge functions called by: `apps/web/api`, `services/*`, `packages/playground-sync`
- Realtime used by: `packages/wonder-runtime`, `packages/playground-sync`

---

## 8. SCRIPTS LAYER (`scripts/`) - **Automation & Operations**

### Build & CI
```
scripts/build-linux.sh           # → apps/web, apps/mobile, packages/*, engine/core
scripts/typecheck/check.mjs      # → ALL TypeScript (tsconfig.base.json)
scripts/split-builder-renderers.mjs  # → apps/web/components/builder, packages/engine-core
scripts/split-builder-blocks.mjs     # → apps/web/components/builder
```

### Asset Pipeline
```
scripts/sync-assets.mjs          # → apps/web/public, apps/mobile/assets, packages/perf-assets
scripts/sync-assets.ts           # TypeScript version
scripts/registry/sync-assets.mjs # → packages/*, registry.json
scripts/sync-guides.sh           # → docs/, content/
scripts/sync-cron.sh             # Cron wrapper for above
```

### Billing & Payments
```
scripts/billing/check-account-trial-migration.mjs  # → supabase/, services/billing, Stripe
scripts/stripe-seed-saas-plan.ts                   # → supabase/seed, Stripe
```

### Security
```
scripts/security/check-dependency-remediation.mjs  # → package.json, packages/*/package.json
scripts/no-placeholders.sh                         # → ALL source files
```

### Development
```
scripts/devtool.sh               # → docker-compose, infra/services, supabase
scripts/smoke.sh                 # → apps/web, apps/mobile, services/*
scripts/start-all.sh             # → docker-compose, all services
scripts/start-playcanvas-isolation.sh  # → engine/core, packages/engine-core
scripts/test-ai-implementation.sh      # → apps/web/ai-modules, config/ai
scripts/verify-npc-preview-model.mjs   # → packages/wonder-runtime, engine/core
scripts/wonder-key.mjs           # → infra/wonderspace, packages/wonder-runtime
```

### Utilities
```
scripts/fix-imports.sh           # → ALL TypeScript imports
scripts/fix-renderers.cjs        # → apps/web/components/builder, packages/engine-core
scripts/generate-tree-directories.sh  # → REPO_MAP.md (this file)
scripts/update-readme.sh         # → README.md, docs/
scripts/kubeconfig-setup.sh      # → deploy/*/kubeconfig, infra/coder/
scripts/release-gates-check.sh   # → ALL tests, typecheck, build
scripts/install_deps.sh          # → package.json, packages/*/package.json
scripts/check-wonderplay.sh      # → apps/web/play, packages/wonder-runtime
```

### Swarm (Parallel Workers)
```
scripts/swarm/run-phase-workers.mjs  # → packages/*, apps/*, scripts/*
scripts/swarm/run-unreal-stack.mjs   # → deploy/unreal, infra/coder/templates/unreal
```

---

## 9. CONFIGURATION LAYER (`config/`)

### `config/ai/` - **AI Model Configuration**
```
config/ai/
├── models/                 # Model configs → apps/web/ai-modules, packages/gesture-engine
├── prompts/                # System prompts → apps/web/ai-modules, aiw-cli
├── providers/              # Provider configs → apps/web/services/ai, config/litellm
└── policies/               # Safety policies → packages/truthshield
```

### `config/litellm/` - **LLM Gateway**
```
config/litellm/
├── config.yaml             # → apps/web/services/ai, services/*, aiw-cli
├── models/                 # Model routing → config/ai/models
└── policies/               # Rate limits, budgets → services/billing, truthshield
```

**Connections:**
- ← `apps/web/ai-modules` (consumes)
- ← `packages/gesture-engine` (ML models)
- ← `packages/truthshield` (content policies)
- → `config/ai` (model definitions)

---

## 10. DOCUMENTATION LAYER (`docs/`)

### Operations (`docs/operations/`)
```
docs/operations/
├── CODER_*.md              # ← infra/coder/, packages/coder-workspace, deploy/*
├── WONDERSPACE_*.md        # ← infra/wonderspace/, packages/wonder-runtime
├── COST_GUARD_*.md         # ← infra/wonderspace/metering, scripts/billing
├── AWS_*.md                # ← deploy/aws/, infra/services/
└── WONDERPLAY_*.md         # ← packages/wonder-runtime, apps/web/play
```

### Research (`docs/research/`)
```
docs/research/              # ← All technical decisions, feeds into:
    # → docs/blueprints/master-schema.json
    # → packages/*/architecture decisions
    # → infra/*/design docs
```

### Blueprints (`docs/blueprints/`)
```
docs/blueprints/
├── master-schema.json      # ← research/, → packages/shared/types, prisma/
└── worker-tasks.json       # → scripts/swarm/*, packages/aiw-cli
```

---

## 11. TESTS LAYER (`tests/`)

```
tests/
├── checkout-pricing-contract.test.ts     # → apps/web/services/billing, supabase
├── dashboard-code-tools-separation.test.ts  # → apps/web/components/dashboard, packages/ide-engine
├── same-page-billing.test.ts             # → apps/web/app/(dashboard)/billing, services/billing
├── wonderbuild-ai-generator-modal.test.tsx # → apps/web/ai-modules, packages/wonder-runtime
├── coder-customer-open.test.ts           # → services/coder, infra/coder, packages/coder-workspace
└── wonderspace-browser-launch.test.ts    # → packages/wonder-runtime, apps/web/play
```

**Test Infrastructure:**
- Uses: `vitest.config.ts`, `test-setup.ts`
- Runs against: Local supabase, mock services, test containers

---

## 12. CROSS-CUTTING CONCERNS

### TypeScript Configuration Chain
```
tsconfig.base.json (root)
    ├── apps/web/tsconfig.json
    ├── apps/mobile/tsconfig.json
    ├── packages/*/tsconfig.json
    ├── engine/core/tsconfig.json
    ├── services/*/tsconfig.json
    ├── scripts/typecheck/known-diagnostics.json
    └── tsconfig.docs.json (for docs/index.tsx)
```

### Dependency Graph (Simplified)
```
┌─────────────────────────────────────────────────────────────────┐
│                      ROOT package.json                          │
│  workspaces: [apps/*, packages/*, engine/*, services/*, infra/*]│
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   apps/web    │  │  apps/mobile  │  │  packages/*   │
│  (Next.js)    │  │   (Expo)      │  │  (11 packages)│
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              ┌─────────────────────────┐
              │    packages/shared      │  ◄── CENTRAL HUB
              │   (types, utils, etc)   │
              └───────────┬─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ engine-core   │ │wonder-runtime │ │ gesture-engine│
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
              ┌─────────────────────────┐
              │      engine/core        │  (PlayCanvas)
              └───────────┬─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   infra/*     │ │   deploy/*    │ │  supabase/    │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Data Flow Examples

#### User Creates WonderSpace Scene
```
1. apps/web/app/(builder)/page.tsx
   → imports: packages/engine-core, packages/wonder-runtime
   → uses: packages/gesture-engine (editor gestures)
   → calls: apps/web/services/wonderspace.ts
   
2. services/wonderspace.ts
   → calls: infra/wonderspace API
   → uses: packages/playground-sync (persistence)
   → stores: supabase (scenes, assets)
   
3. infra/wonderspace/runtime
   → runs: packages/wonder-runtime (Docker)
   → connects: packages/playground-sync (multiplayer)
   → serves: packages/perf-assets (CDN)
   
4. apps/web/app/(play)/[sceneId]/page.tsx
   → loads: packages/wonder-runtime
   → streams: packages/perf-assets
   → syncs: packages/playground-sync
```

#### Coder Workspace Launch
```
1. apps/web/app/(dashboard)/workspaces/[id]/page.tsx
   → calls: apps/web/services/coder.ts
   
2. services/coder.ts
   → calls: Coder API (infra/coder)
   → uses: packages/coder-workspace (templates)
   
3. infra/coder (K8s)
   → provisions: packages/coder-workspace/templates/*
   → runs: scripts/workspace-runtime/start-all.sh
   → connects: infra/services/messaging, database
   
4. Workspace IDE
   → loads: packages/ide-engine (editor)
   → connects: packages/coder-workspace/filesystem, terminal
   → accesses: packages/wonder-runtime (preview)
```

#### Billing Flow
```
1. apps/web/app/(dashboard)/billing/page.tsx
   → uses: apps/web/services/billing.ts
   → calls: Stripe, supabase/billing
   
2. scripts/billing/check-account-trial-migration.mjs
   → reads: supabase (accounts, subscriptions)
   → calls: Stripe API
   → updates: supabase (migration status)
   
3. packages/truthshield (fraud)
   → monitors: services/billing events
   → flags: suspicious activity
   
4. infra/wonderspace/metering
   → tracks: usage from wonder-runtime
   → reports: billing service
```

---

## 13. KEY INTEGRATION POINTS SUMMARY

| Integration Point | Primary Files | Connected Components |
|-------------------|---------------|---------------------|
| **Auth** | `packages/shared/auth`, `apps/web/lib/auth`, `apps/mobile/lib/auth` | NextAuth, Supabase Auth, Expo SecureStore |
| **Database** | `prisma/schema.prisma`, `supabase/migrations`, `packages/shared/supabase` | All services, apps, playground-sync |
| **Real-time** | `packages/playground-sync`, `supabase/realtime`, `infra/wonderspace/sync` | Wonder-runtime, multiplayer, presence |
| **Assets** | `packages/perf-assets`, `scripts/sync-assets*`, `infra/wonderspace/cdn` | Engine-core, wonder-runtime, web/mobile |
| **AI** | `config/ai`, `apps/web/ai-modules`, `packages/gesture-engine`, `packages/truthshield` | Builder, play, moderation, CLI |
| **Coder** | `infra/coder`, `packages/coder-workspace`, `services/coder`, `apps/web/services/coder` | Workspaces, templates, IDE, deploy |
| **Billing** | `services/billing`, `scripts/billing`, `packages/shared/billing`, `supabase` | Stripe, trials, metering, fraud |
| **Deployment** | `deploy/k8s`, `infra/*`, `packages/*/Dockerfile`, `scripts/build-linux.sh` | All apps, packages, services |

---

## 14. NAVIGATION BY TASK

| Task | Start Here | Follow To |
|------|------------|-----------|
| Add web feature | `apps/web/app/` | `components/`, `lib/`, `services/`, `packages/shared` |
| Add mobile screen | `apps/mobile/app/` | `components/`, `lib/`, `packages/shared` |
| Modify 3D engine | `engine/core/` | `packages/engine-core`, `packages/wonder-runtime` |
| Add WonderSpace feature | `packages/wonder-runtime/` | `infra/wonderspace`, `apps/web/play`, `apps/mobile/play` |
| Change deployment | `deploy/k8s/` | `infra/*`, `deploy/{civo,aws}`, `packages/coder-workspace` |
| Update database | `prisma/schema.prisma` | `supabase/migrations`, `packages/shared/supabase`, `services/*` |
| Add AI feature | `apps/web/ai-modules/` | `config/ai`, `packages/shared/ai`, `packages/truthshield` |
| Debug build | `scripts/build-linux.sh` | `package.json`, `packages/*/package.json`, `tsconfig.base.json` |
| Run tests | `tests/` | `vitest.config.ts`, `test-setup.ts`, relevant app/package |
| Security audit | `scripts/security/` | `package.json`, `packages/*/package.json`, `SECURITY.md` |

---

*This map shows the wiring - use it to trace dependencies, plan changes, and understand data flow.*