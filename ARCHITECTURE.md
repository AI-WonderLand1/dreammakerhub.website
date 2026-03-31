# Architecture

AI Wonderland is a pnpm-workspace monorepo centered on a Next.js SaaS web application (`apps/web`) with supporting APIs, platform scripts, and documentation artifacts.

## High-level Modules

- `apps/web`: Product UI and backend-for-frontend API routes.
- `tests`: Vitest contract, route, and configuration guards.
- `supabase`: Database functions and migration assets.
- `scripts`: Repository automation (doc sync, smoke checks, registry synchronization, swarm helpers).
- `docs`: Generated API docs and docs-site consumable guide copies.

## Runtime Boundaries

```text
Browser/Client UI
  -> Next.js App Router pages (apps/web/app/*)
  -> Next.js route handlers (apps/web/app/api/*)
     -> domain services/utilities in apps/web/lib, services, runners
     -> storage + external providers (Supabase, webhooks, integrations)
```

## Product Surfaces

- **Public marketing + legal pages** live under route groups like `apps/web/app/(public)`.
- **Workspace/dashboard experiences** live under `apps/web/app/(workspace)` and `apps/web/app/wonderspace`.
- **Builder tools** live in `apps/web/app/(builder)` and associated API namespaces (`/api/wonder-build`, `/api/puck`, etc.).
- **Operational pages** include docs, status, support, tutorials, and auth surfaces.

## API Topology

Primary API areas under `apps/web/app/api` include:
- `ai`, `agent`, `auth`
- `projects`, `wonderspace`, `wonder-build`, `builder`
- `subscription`, `checkout`, `billing`-adjacent handlers
- `analytics`, `health`, `logs`, `support`
- `storage`, `domains`, `webhooks`, `extensions`, `github`

Contract source remains `openapi.yaml` at repo root, with generated artifacts in `docs/`.

## Reliability & Quality Controls

- Route and link integrity are protected by targeted tests in `tests/`.
- Documentation consistency is guarded by `tests/readme-accuracy.test.ts` and sync scripts.
- CI gate expectations rely on passing Vitest checks prior to merge.
