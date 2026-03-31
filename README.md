# AI Wonderland

AI Wonderland is a monorepo for building and running AI-powered web experiences.

## Basic Info

- **Main app:** `apps/web` (Next.js)
- **Language:** TypeScript
- **Architecture:** Monorepo with apps, packages, engine, UI, and infra modules
- **Core integrations:** Supabase, Vercel, Docker, Theia, PlayCanvas/WebGLStudio

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
