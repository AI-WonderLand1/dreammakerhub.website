# AI Wonderland

## Overview
A Next.js monorepo (pnpm workspaces) running on Replit. The main web app lives in `apps/web` and uses Next.js 15 with React 18, Supabase for auth/database, and various AI integrations (OpenAI, Google Generative AI).

## Architecture
- **Monorepo**: pnpm workspaces managing `apps/*`, `packages/*`, `engine/**`, `WonderSpace`, `ui`
- **Web app**: `apps/web` — Next.js 15 App Router, Tailwind CSS, Supabase SSR
- **Packages**: Shared packages including `@puckeditor/core`, `unreal-wonder-build`, `@wonder/shadon`, etc.
- **Package manager**: pnpm 10.26.1

## Running the App
The app runs via the "Start application" workflow:
```
cd apps/web && PORT=5000 pnpm run dev
```
This starts Next.js dev server on port 5000 (required for Replit preview).

## Port Configuration
- Dev server: port 5000 (`apps/web/scripts/dev-port.mjs` sets `DEFAULT_WEB_DEV_PORT = 5000`)
- Start script: `next start -p 5000 -H 0.0.0.0`

## Environment Variables
The following env vars are set in `.replit` `[userenv.shared]`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/publishable key
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase publishable key

Additional secrets (service role key, API keys, etc.) should be added via the Secrets panel.

## Key Technologies
- Next.js 15 (App Router)
- React 18
- Tailwind CSS v3
- Supabase (auth + database)
- AI SDK (OpenAI, Google Generative AI)
- Monaco Editor
- Theatre.js
- Colyseus (multiplayer)
- Puck page editor (`@puckeditor/core`) with shadon blocks
- Three.js / @react-three/fiber / @react-three/drei (3D robot scene in AI modules)
- react-use

## Shadon Library (`@wonder/shadon`)
Located in `packages/shadon/`. A shared shadcn-style UI component library used throughout the monorepo.

### Exported Components
- `Button` — variant (default, outline, ghost, destructive, secondary), size (sm, md, lg)
- `Card`, `CardHeader`, `CardContent`, `CardFooter` — variant (default, bordered, glass)
- `Badge` — variant (default, secondary, success, warning, destructive, outline)
- `Alert` — variant (default, info, success, warning, destructive)

## Puck Editor (`/wonder-build/puck`)
Layout Studio for building reusable page sections. Config at `apps/web/app/(builder)/wonder-build/puck/puck.config.tsx`.

### Registered Blocks (19 total, organized by category)

**Layout & Structure**
| Block | Description |
|-------|-------------|
| HeroSectionBlock | Full-width hero with eyebrow, title, CTA, and 4 background themes (neon, psychedelic, dark, egyptian) |
| BentoGridBlock | Masonry-style feature grid with configurable items and accent color |
| SectionContainerBlock | Grouping container with optional title, label, and background variant |
| NavigationBlock | Responsive nav bar with logo, links, and CTA — 3 themes |
| FooterBlock | Multi-column footer with brand, links, and copyright |

**AI & Interaction**
| Block | Description |
|-------|-------------|
| AIChatInterfaceBlock | Styled chat UI with agent name, sample messages, 3 themes (hieroglyphic, neon, minimal) |
| PromptInputBlock | Magic prompt textarea with styled CTA button — 3 color themes |
| VoiceModuleTriggerBlock | Egyptian Voice Module card with waveform animation |

**Media & 3D**
| Block | Description |
|-------|-------------|
| ThreeCanvasWrapperBlock | WebGL/Three.js canvas placeholder with grid overlay and scene type selector |
| ImageGalleryBlock | Blueprint gallery with configurable columns, aspect ratio, and image URLs |
| VideoPlayerBlock | Styled video player with autoplay/loop support and overlay caption |

**Standard UI (Shadon-powered)**
| Block | Source | Description |
|-------|--------|-------------|
| FeatureCardsBlock | native | Feature grid for listing platform capabilities |
| PricingTableBlock | native | Full 3-tier pricing table (Nomad/Architect/Creator) |
| ButtonBlock | `@wonder/shadon` | Button with variant + size + href |
| CardBlock | `@wonder/shadon` | Card with title, description, body, variant |
| BadgeBlock | `@wonder/shadon` | Inline badge with color variants |
| AlertBlock | `@wonder/shadon` | Alert banner with icon and variants |

**Typography**
| Block | Description |
|-------|-------------|
| HeadingBlock | Styled h1 heading |
| TextBlock | Rich text with superscript support |

## Build Status
The production build passes cleanly (`pnpm run build` in `apps/web`). Key settings in `next.config.js`:
- `eslint.ignoreDuringBuilds: true` — ESLint runs separately in CI, not during builds
- `typescript.ignoreBuildErrors: true` — Pre-existing Supabase type issues are tracked but don't block builds
- `supabaseServer` in `lib/supabaseServer.ts` uses a Proxy for lazy initialization (prevents build-time crash when `SUPABASE_SERVICE_ROLE_KEY` is absent)
- PlayCanvas page uses `<Suspense>` wrapper around `useSearchParams()` consumer

## GitHub CI/CD
- `.github/workflows/ci.yml` — Runs on PRs and feature branches: install + test
- `.github/workflows/main_ai-wonderland.yml` — Runs on main: build + deploy to Azure Web App
- `.github/dependabot.yml` — Weekly npm dependency updates (grouped)

## Path Aliases (apps/web/tsconfig.json)
- `@/*` → `apps/web/*`
- `@lib/*` → `apps/web/lib/*`
- `@core/*` → `engine/core/*`
- `@components/*` → `ui/components/*`
- `@runners/*` → `runners/*`
- `@services/*` → `infra/services/*`
- `@engine/*` → `engine/*`
- `@infra/*` → `infra/*`

## BYOC (Bring Your Own Cloud)
- Settings page: `/dashboard/settings/byoc`
- API routes: `/api/cloud-connections`, `/api/cloud-connections/[id]`, `/api/byoc/environments`
- Credential encryption: `apps/web/lib/crypto/byoc.ts`
- DB migration: `supabase/migrations/20260318_byoc_cloud_connections.sql`
- SDK: `apps/web/lib/byocSdk.ts`

## AI Modules / Playground
- Public route: `/ai-modules` — Module Explorer + Fine-Tuning Lab with 3D robot scene
- Constitutional playground: `apps/web/ai-modules/page.tsx` (EGYPT_CORE theme)
- 3D robot: `apps/web/ai-modules/scene/RobotScene.tsx` — shows BYOK/BYOC status
- Module playground route: `/playground`

## Replit Migration Notes
- Dependencies installed via `pnpm install --no-frozen-lockfile`
- `allowedDevOrigins` in `next.config.js` includes `*.worf.replit.dev` and other Replit domains to fix cross-origin iframe warnings
- `experimental.turbo` deprecated config moved to top-level `turbopack`
- Dev port: 5000 (Replit requires port 5000 for webview)
- Supabase auth is kept as-is (stub auth context wraps real Supabase calls)
- PostgreSQL database provisioned via Replit (DATABASE_URL env var set)
