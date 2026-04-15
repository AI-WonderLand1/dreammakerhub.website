# WonderSpace Documentation

Complete documentation for the WonderSpace platform.

---

## Table of Contents

- [Architecture](#architecture)
- [Integration Guides](#integration-guides)
- [PlayCanvas Isolation](#playcanvas-isolation-workflow)
- [WebGL Studio Integration](#webgl-studio-integration)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Competitive Positioning](#competitive-positioning)
- [Contributing](#contributing)

---

## Architecture

WonderSpace is a monorepo built around three core systems:

1. **AI Orchestrator** — Routes prompts across AI providers (OpenRouter, Groq, GitHub) with fallback chains and safety filtering.
2. **Multi-Engine Host** — Manages PlayCanvas, WebGL Studio, and Puck editor runtimes with isolated sandboxes per workspace.
3. **Sovereign OS Context** — Provides per-user persistent workspaces with dedicated resources, auth gateways, and BYOC (Bring Your Own Cloud) integration.

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `apps/web/` | Next.js app — pages, API routes, components |
| `engine/core/` | AI providers, IDE runtime, PlayCanvas bridge, filesystem, persistence |
| `packages/ide-engine/` | WebContainer-based browser IDE (SessionStore, TerminalEmulator, ErrorScanner) |
| `packages/playcanvas-ext/` | PlayCanvas integration package |
| `packages/puck-editor/` | Puck visual editor blocks and config |
| `packages/shadon/` | Shared UI component library |
| `ui/components/` | ChatBox, SpiritGuide, BYOCExplanation, Billing components |
| `lib/` | Shared utilities (`env`, `logger`, `requireEnv`, auth helpers) |
| `runners/` | Background workers (aiWorker, authWorker, registry, data-processing) |
| `infra/coder/` | Coder workspace template (Terraform) + Helm values for OKE |
| `config/ai/` | AI system prompts and constitution |

### Path Aliases

Configured in `tsconfig.base.json`:

- `@lib/*` → `lib/*`
- `@/components/*` → `ui/components/*`
- `@/lib/*` → `apps/web/lib/*`

---

## Integration Guides

### PlayCanvas Isolation

The `IsolatedPlayCanvas` component embeds PlayCanvas in a sandboxed iframe:

```tsx
import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';

<IsolatedPlayCanvas
  sceneUrl="/scenes/my-scenario.json"
  onReady={(api) => console.log('Engine ready', api)}
  onError={(err) => console.error('Engine error', err)}
/>
```

Advanced multi-scene usage:

```tsx
<IsolatedPlayCanvas
  sceneUrl="/scenes/lobby.json"
  onSceneLoad={(scene) => scene.load()}
  onMessage={(msg) => handleCrossScene(msg)}
/>
```

Environment variables for PlayCanvas:

```env
NEXT_PUBLIC_PLAYCANAS_URL=https://your-playcanvas-instance.com
NEXT_PUBLIC_PC_SCENE_BUCKET=your-bucket
```

### Server-Side API Routes

```ts
// apps/web/app/api/playcanvas/route.ts
export async function POST(req: Request) {
  const { scene } = await req.json();
  const result = await processScene(scene);
  return Response.json(result);
}
```

### Service Worker Registration

For offline PlayCanvas asset caching, register the service worker in your layout:

```tsx
// apps/web/app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/playcanvas-sw.js');
  }
}, []);
```

### Testing PlayCanvas Integration

```ts
import { render, screen } from '@testing-library/react';
import { IsolatedPlayCanvas } from '@/components/playcanvas-isolation';

test('renders PlayCanvas canvas', () => {
  render(<IsolatedPlayCanvas sceneUrl="/test-scene.json" />);
  expect(screen.getByRole('img')).toBeInTheDocument();
});
```

---

## PlayCanvas Isolation Workflow

Full lifecycle from local dev to production:

### Phase 1: Local Development
1. Start dev server: `npm run dev`
2. PlayCanvas runs in isolation iframe at `/playcanvas-isolation`
3. Use `IsolatedPlayCanvas` component for embedding

### Phase 2: Scene Management
- Scenes stored in Supabase Storage (`scenes` bucket)
- Upload via `SupabaseDrive` bridge class
- Scene metadata tracked in `scenes` table

### Phase 3: Integration
- Bridge communication via `postMessage` API
- React state sync through `PlayCanvasBridge` context
- Event system for scene lifecycle (load, ready, error, destroy)

### Phase 4: Testing
- Unit tests with Jest + React Testing Library
- Integration tests with PlayCanvas mock
- E2E tests with Playwright

### Phase 5: Deployment
- Build: `npm run build`
- Deploy to Vercel: `vercel deploy`
- Verify smoke tests: `scripts/smoke.sh`

### Phase 6: Monitoring
- Health check endpoint: `/api/health/ai`
- Error tracking via `logger` utility
- Performance metrics via PlayCanvas stats API

---

## WebGL Studio Integration

### React Integration

WebGL Studio runs in an iframe with `postMessage` communication:

```tsx
const iframeRef = useRef<HTMLIFrameElement>(null);

const handleMessage = (event: MessageEvent) => {
  if (event.data.type === 'scene-ready') handleSceneLoad(event.data);
  if (event.data.type === 'scene-error') handleSceneError(event.data);
};

useEffect(() => {
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

// Send commands to WebGL Studio
iframeRef.current?.contentWindow?.postMessage({
  type: 'load-scene',
  scene: sceneData,
}, '*');
```

### Asset Library Module

Build custom `AssetLibraryModule` for WebGL Studio:

```ts
class AssetLibraryModule {
  constructor() {
    this.primitives = PRIMITIVE_ASSETS;
    this.aiAssets = [];
    this.userAssets = [];
  }

  async loadUserAssets(supabaseClient: SupabaseClient) {
    const { data } = await supabaseClient.storage.from('assets').list();
    this.userAssets = data;
  }

  async generateAIAsset(prompt: string) {
    const response = await fetch('/api/ai/generate-asset', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    return response.json();
  }
}
```

### Supabase Drive Integration

Replace WebGL Studio's LiteFileSystem with `SupabaseDrive`:

```ts
class SupabaseDrive {
  async upload(path: string, file: File): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('webgl-assets')
      .upload(path, file);
    if (error) throw error;
    return data.path;
  }

  async download(path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from('webgl-assets')
      .download(path);
    if (error) throw error;
    return data;
  }

  async list(prefix: string): Promise<FileEntry[]> {
    const { data, error } = await this.supabase.storage
      .from('webgl-assets')
      .list(prefix);
    if (error) throw error;
    return data;
  }
}
```

Register in WebGL Studio's `DriveModule`:

```ts
// In WebGL Studio initialization
const driveModule = new DriveModule({
  drive: new SupabaseDrive(supabaseClient),
  autoSave: true,
  saveInterval: 30000, // 30 seconds
});
```

---

## Deployment

### Build & Validation

```bash
npm run build           # Production build
npm run typecheck       # TypeScript validation
scripts/smoke.sh        # Smoke tests
scripts/release-gates-check.sh  # Release gate validation
```

### Font Strategy

- No Google Fonts loaded at runtime
- All fonts bundled via `@next/font` or local font files
- Font subsetting handled at build time

### Release Checklist

1. All TypeScript errors resolved (`npm run typecheck`)
2. Smoke tests pass (`scripts/smoke.sh`)
3. Release gates pass (`scripts/release-gates-check.sh`)
4. No hardcoded secrets in code
5. Environment variables documented in `.env.example`

### Deploy to Vercel

```bash
vercel deploy --prod
```

### OCI Kubernetes (OKE) — Coder Workspaces

| Resource | Details |
|----------|---------|
| Cluster | `cluster1` in us-chicago-1 |
| Node Pool | E5.Flex, 1 node at 10.0.10.213 |
| Coder | v2.32.0 with Kubernetes provisioner |
| Template | `infra/coder/template/main.tf` |
| Namespace | `coder` |

---

## Security

### Reporting

Report security issues to: **security@freedomian.com**

### Measures

- HTTPS enforced on all endpoints
- Supabase Auth for user authentication
- Container isolation per workspace (Coder/Kubernetes)
- Rate limiting on API routes
- Input validation via Zod schemas
- No server-side secrets in client-accessible code

### Known Issues

See `REVIEW_TRACKER.md` for a full security audit. Key items:
- Verify no hardcoded fallback secrets in production
- Ensure auth middleware covers all `/api/wonderspace` routes
- Replace mock AI endpoints with real provider connections before production

---

## Troubleshooting

### Dev Server Won't Start

| Problem | Solution |
|---------|----------|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then `npm install` |
| Port 3000 in use | `lsof -i :3000` then kill the process, or use `PORT=3001 npm run dev` |
| Missing env vars | Copy `.env.example` to `.env.local` and fill in values |
| Build errors | Run `npm run typecheck` to find type errors |
| Working directory wrong | Ensure you're in the repo root, not `apps/web` |

### Coder Workspace Issues

- Coder template push timeout: Use the Coder web UI to create templates instead of CLI
- Workspace stuck provisioning: Check `kubectl get pods -n coder`
- Cloudflare DERP errors: Move to direct OCI access (no tunnel)

---

## Competitive Positioning

WonderSpace differentiates from GitHub Codespaces, Gitpod, Replit, and CodeSandbox:

- **AI-First**: Voice-to-code, AI agent workflows, SpiritGuide assistant
- **Multi-Engine**: PlayCanvas + WebGL Studio + Puck editor in one workspace
- **BYOC**: Bring Your Own Cloud — deploy anywhere (OCI, AWS, GCP)
- **White-Label**: Rebrandable IDE for platform partners
- **Mobile-First**: Responsive design for tablet/mobile creation

---

## Contributing

### Setup

```bash
npm install          # Use npm, not pnpm or yarn
npm run dev          # Start dev server
```

### Code Style

- Server components by default (Next.js App Router)
- `use client` only when needed (event handlers, hooks, browser APIs)
- Framework-agnostic logic goes in `engine/core/` or `lib/`
- Component-specific logic stays in the component file
- Path aliases: `@lib/*`, `@/components/*`, `@/lib/*`

### Branching

- `main` → production
- Feature branches: `feature/description`
- Bug fixes: `fix/description`

### Docs Sync

Run `scripts/sync-guides.sh` to mirror docs from `docs/` to the app's marketing pages.

### Puck Editor Blocks

19 built-in blocks available in `packages/puck-editor/`: Hero, Text, Image, Video, Button, Container, Grid, Columns, Tabs, Accordion, Card, Carousel, Form, Spacer, Divider, Quote, Pricing, FAQ, Navigation.

### Replit Configuration

If running on Replit:
- Port: 5000
- Use npm (not pnpm)
- Set all Supabase env vars in Replit Secrets
- See `replit.md` for full details