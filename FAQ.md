# AI Wonderland FAQ

## What is AI Wonderland?
AI Wonderland is a SaaS platform that combines:
- Marketing/public web pages
- Authenticated workspace and project tooling
- AI-assisted builder and IDE-like experiences
- Isolated cloud development environments for each user
- Operational APIs (auth, health, logs, analytics, storage, and more)

The main product app lives in `apps/web`.

## What are the core product areas?
- **Wonder Build**: Visual builder routes and APIs for composition workflows
- **WonderSpace**: Project/workspace management and tool-centric experiences
- **SpiritGuide**: AI-powered assistant that knows everything about your site
- **Cloud IDEs**: Isolated cloud development environments for each user
- **Public SaaS shell**: Onboarding, docs, support, pricing/subscription, and legal pages

## What is SpiritGuide?
SpiritGuide is your AI-powered support assistant that knows anything about your site. It can answer questions, help navigate, and assist with using the platform. Look for the chat widget in the bottom-right corner.

## What are Cloud Development Environments?
Each user gets their own isolated cloud development environment with:
- Pre-configured IDE (code-server with VSCode extensions)
- Persistent storage for projects
- Support for 3D/游戏 development (PlayCanvas, WebGLStudio)
- Node.js, Python, and development tools pre-installed

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

## What technologies power this?
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email, GitHub, Google)
- **AI**: OpenAI, Google Gemini, OpenRouter, Hugging Face
- **3D**: PlayCanvas, WebGLStudio
- **Cloud IDE**: code-server (VSCode in browser)
- **Deployment**: Vercel, Docker, Kubernetes
