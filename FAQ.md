# AI Wonderland FAQ

## What is this repository?
AI Wonderland is a monorepo for a SaaS platform that combines:
- marketing/public web pages,
- authenticated workspace and project tooling,
- AI-assisted builder and IDE-like experiences,
- operational APIs (auth, health, logs, analytics, storage, and more).

The main product app lives in `apps/web`.

## What are the core product areas?
- **Wonder Build**: visual builder routes and APIs for composition workflows.
- **WonderSpace**: project/workspace management and tool-centric experiences.
- **Public SaaS shell**: onboarding, docs, support, pricing/subscription, and legal pages.

## Where are API routes implemented?
In `apps/web/app/api/*` (Next.js route handlers), grouped by domain (AI, auth, projects, collaboration, health, etc.).

## How do I run the project locally?
```bash
pnpm install
pnpm dev
```

## How do I verify changes before commit?
```bash
pnpm test
pnpm build
```

For lightweight local fallback checks, you can also run:
```bash
node verify_logic.js
```

## Where is the API contract?
- Source: `openapi.yaml`
- Generated docs: `docs/openapi.html`, `docs/openapi.yaml`, and related assets.

## How is documentation kept in sync?
Root guides are source-of-truth:
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `DEPLOYMENT.md`

Sync copies for docs site with:
```bash
bash scripts/sync-guides.sh
```
