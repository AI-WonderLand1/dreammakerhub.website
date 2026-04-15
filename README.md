# AI Wonderland

AI Wonderland is a monorepo for building and running AI-powered web experiences with isolated cloud development environments.

## Basic Info

- **Main app:** `apps/web` (Next.js)
- **Language:** TypeScript
- **Architecture:** Monorepo with apps, packages, engine, UI, and infra modules
- **Core integrations:** Supabase, Vercel, Coder (OCI Kubernetes), PlayCanvas/WebGLStudio
- **Key Feature:** Isolated cloud development environments for each user with persistent storage and dedicated resources

## Infrastructure

### OCI Kubernetes (OKE)
- **Region:** US-Chicago-1
- **Cluster:** `cluster1` (public endpoint: 64.181.195.19:6443)
- **Node Pool:** E5.Flex, 1 node at 10.0.10.213
- **Namespace:** `coder`

### Coder (Cloud IDE)
- **Access URL:** coder.dreammakerhub.website
- **Template:** `infra/coder/template/main.tf`
- **Workspace clones:** psychic-octo-fishstick repo automatically

## Repository Structure

- `apps/` — application entrypoints (including the web app)
- `packages/` — reusable packages and bridges
- `engine/` — core runtime modules
- `ui/` — shared UI components
- `infra/` — infrastructure-related code/config
  - `coder/template/` — Coder workspace template
- `docs/` — generated and authored documentation

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

See `.env.example` for full configuration including:
- `CODER_ACCESS_URL` — Coder instance URL
- `CODER_WILDCARD_ACCESS_URL` — Wildcard for workspace apps
- Supabase, Vercel, and AI provider keys
