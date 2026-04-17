# WonderSpace

AI-powered creative platform for building web experiences, 3D worlds, and interactive apps.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework:** Next.js (TypeScript)
- **Auth:** Supabase Auth
- **3D Engines:** PlayCanvas, WebGL Studio
- **Visual Editor:** Puck (drag-and-drop page builder)
- **AI:** OpenRouter, Groq, GitHub Models
- **Infrastructure:** OCI Kubernetes (OKE), Coder (cloud IDE)
- **Deployment:** Self-hosted (Oracle Cloud VM / OKE)

## Project Structure

```
apps/web/          → Next.js app (pages, API routes, components)
engine/core/      → AI orchestration, IDE runtime, PlayCanvas bridge
packages/         → Shared packages (ide-engine, playcanvas-ext, puck-editor, etc.)
ui/components/    → Reusable UI components (ChatBox, SpiritGuide, etc.)
lib/              → Shared utilities (env, logger, auth, crypto)
runners/          → Background workers (aiWorker, authWorker, registry)
scripts/          → Shell scripts (build, smoke test, deploy)
infra/coder/      → Coder workspace template + Helm values
config/           → AI system prompts, constitution
```

## Environment Variables

See `.env.example` for all configuration including:
- Supabase URL and keys
- OpenRouter / Groq / GitHub API keys
- `CODER_ACCESS_URL` — Coder instance URL
- `CODER_WILDCARD_ACCESS_URL` — Workspace app URLs

## Infrastructure

| Resource | Details |
|----------|---------|
| OKE Cluster | `cluster1` in us-chicago-1 |
| Node Pool | E5.Flex, 1 node at 10.0.10.213 |
| Coder | v2.32.0, template at `infra/coder/template/main.tf` |

## Full Documentation

See [DOCS.md](./DOCS.md) for architecture, integration guides, deployment, security, and troubleshooting.
## Deployment (No Vercel)

If you are hosting on Oracle and using Supabase, use:
- [docs/guides/oracle-no-vercel-deployment.md](./docs/guides/oracle-no-vercel-deployment.md)


## Contributing

See [DOCS.md → Contributing](./DOCS.md#contributing) for setup and code style rules.