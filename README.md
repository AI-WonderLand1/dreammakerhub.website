# AI Wonderland

AI Wonderland is a monorepo for building and running AI-powered web experiences with isolated cloud development environments.

## Basic Info

- **Main app:** `apps/web` (Next.js)
- **Language:** TypeScript
- **Architecture:** Monorepo with apps, packages, engine, UI, and infra modules
- **Core integrations:** Supabase, Vercel, Docker, Coder, PlayCanvas/WebGLStudio
- **Key Feature:** Isolated cloud development environments for each user with persistent storage and dedicated resources

## Repository Structure

- `apps/` — application entrypoints (including the web app)
- `packages/` — reusable packages and bridges
- `engine/` — core runtime modules
- `ui/` — shared UI components
- `infra/` — infrastructure-related code/config
- `docs/` — generated and authored documentation

## Quick Start

```bash
npm install
npm run dev
```

## Notes

This repository intentionally keeps a single top-level `README.md` as the main project documentation entrypoint.
