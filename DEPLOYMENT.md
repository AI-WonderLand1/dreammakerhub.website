# Deployment Guide

This repository deploys primarily as a Next.js SaaS web application (`apps/web`) with companion services and docs artifacts.

## 1) Prerequisites

- Node.js + pnpm compatible with lockfile/toolchain.
- Environment variables configured for all active integrations (auth, AI providers, storage, billing).
- Any Supabase migration/function changes applied from `supabase/`.

## 2) Build and Validation Flow

Run from repo root:

```bash
pnpm install
pnpm test
pnpm build
```

If your delivery touches docs or contracts:

```bash
bash scripts/sync-guides.sh
bash scripts/generate-tree-directories.sh
```

## 3) Smoke Verification

Use local smoke scripts when external infrastructure is unavailable:

```bash
node verify_logic.js
bash scripts/smoke.sh
```

These checks are useful fallback validation when cloud registries or remote dependencies are blocked.

## 4) Release Checklist

- [ ] Vitest suite passes.
- [ ] Build passes.
- [ ] Route/link changes validated (no dead navigation targets).
- [ ] README and guide docs updated for user-visible behavior.
- [ ] API contract/docs updated when route handlers change.

## 5) Post-Deploy Checks

- Confirm key user flows: marketing entry, auth, dashboard/workspace, builder surfaces.
- Confirm critical APIs: health endpoints, auth/session routes, project operations.
- Monitor logs for 4xx/5xx spikes and roll back if contract regressions appear.


## 6) Font Strategy (No Runtime Google Fetch)

`apps/web` must not depend on `next/font/google` during `next build` because CI and some deployment environments block outbound network calls.

- The root layout uses local/system font stacks only (no runtime download step).
- Keep font configuration in `apps/web/app/globals.css` using CSS variables (`--font-sans`, `--font-serif`, `--font-mono`) with system fallbacks.
- If you introduce custom branded fonts in the future, self-host them in-repo and load with `next/font/local` rather than `next/font/google`.

Verification command for release checks:

```bash
CI=1 NEXT_TELEMETRY_DISABLED=1 pnpm --filter ai-wonder-web build
```

This validates the web build path under CI-like constraints without relying on external font fetches.

## 7) Release Gates

- Complete the release gate checklist before requesting production deployment approval: [`docs/release-gates.md`](docs/release-gates.md).
- In CI, run the automated gate job (`release_gates`) and then have a reviewer complete the manual sign-off job (`release_gates_manual`).
- Production deploy approval is blocked until both release gate jobs pass.
