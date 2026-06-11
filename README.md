# DreamMakerHub

> **Build anything instantly — no setup required.**
> AI-powered multi-engine development platform.

---

## What Is This?

DreamMakerHub is a unified platform where anyone can launch a dev environment, build with AI/code/visual tools, and deploy — all from one place. No more juggling IDEs, AI tools, hosting, and APIs separately.

---

## How Do I Run It?

```bash
git clone https://github.com/AI-WonderLand1/dreammakerhub.website
cd dreammakerhub.website
npm install
# Create .env.local with your keys (see .env.example)
npm run dev
```

Dev server runs at **localhost:3000**.

Other commands:
```bash
npm run build    # Build all workspaces
npm test         # Run tests (vitest)
npm run lint     # Lint + typecheck
```

---

## Why Should I Care? — Pitch Deck

### Problem

Building software today is fragmented and complex:
- Developers juggle multiple tools (IDE, hosting, AI, APIs)
- Non-technical users are locked out
- Setup time slows down innovation
- AI tools are disconnected from real development environments

**Result:** Building anything is harder than it should be.

---

### Solution

**DreamMakerHub** simplifies the entire process. A unified platform where users can:
- Launch a full development environment instantly
- Build using AI, code, or visual tools
- Use multiple "engines" depending on their workflow
- Deploy directly from the same system

---

### What It Is

DreamMakerHub is a **multi-engine development platform** combining:
- Cloud IDE (workspace environments)
- AI agent system
- No-code / low-code builders
- API & backend generation tools
- Deployment infrastructure

All in one platform.

---

### Product Architecture

DreamMakerHub is modular and extensible.

| Layer | Purpose |
|-------|---------|
| **Workspace Engine** | Instant dev environments |
| **AI Agent Engine** | Automation + generation |
| **Builder Engines** | Visual + no-code tools |
| **Deployment Engine** | Hosting + infrastructure |
| **API Engine** | Backend generation |

---

### Key Engine: AI-Bilder

AI-Bilder is one of the platform's engines. It enables:
- Drag-and-drop website & app building
- AI-powered generation
- Image-to-code conversion
- API generation
- Code export (React / HTML)
- Domain + analytics integration

This serves as the entry point for non-technical users.

---

### How It Works

1. User clicks **Create Workspace**
2. A cloud development environment is created instantly
3. User selects an engine (AI builder, code, etc.)
4. Builds using AI, visual tools, or code
5. Runs and deploys directly

---

### Why This Is Different

Most platforms focus on one piece:
- **Webflow** → design
- **Replit** → coding
- **Vercel** → deployment
- **AI tools** → generation

**DreamMakerHub combines all of them.** A platform of platforms.

---

### Market Opportunity

- AI development tools market → rapidly growing
- No-code / low-code → billions in adoption
- Cloud IDEs → expanding with remote dev

DreamMakerHub sits at the intersection of all three.

---

### Business Model

- SaaS subscriptions (workspace usage)
- Premium AI usage tiers
- Engine marketplace (future)
- Deployment & hosting fees

---

### Current Status

- Core platform architecture built
- AI-Bilder engine developed
- Infrastructure + deployment system in place
- Multi-engine foundation established

---

### Vision

> Make building anything as simple as describing it.

Future expansion:
- Engine marketplace
- User-created tools
- AI automation pipelines
- Team collaboration environments

---

### Closing

DreamMakerHub transforms how software is built:
- **Faster**
- **Simpler**
- **More accessible**

From idea → to product → instantly.

---

### Call to Action

**Seeking:**
- Investment
- Technical partnerships
- Early adopters

Let's build the future of creation.

---

## How Is It Built?

### Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 6, Tailwind CSS v4, shadcn/ui |
| **AI** | OpenRouter, Gemini, Groq, GitHub Models, Cerebras |
| **3D** | PlayCanvas, Three.js (@react-three/fiber), Theatre.js |
| **Editor** | Puck (drag-and-drop), Monaco Editor, WebContainer API |
| **Runtime** | OCI Kubernetes (OKE), Coder v2.32.0 |
| **Auth/DB** | Supabase (PostgreSQL + Auth + Storage + Realtime + pgvector) |
| **Payments** | Stripe (Checkout, Billing, Connect) |
| **Infra** | Oracle Cloud (OKE), Terraform, Helm, cert-manager |

### Repository Structure

```
apps/web/                 → Next.js 16 app (pages, API routes)
packages/
  ide-engine/             → WebContainer-based browser IDE
  optimizer/              → 3D asset optimization server
  perf-assets/            → 3D scene performance profiling
  wonder-runtime/         → GLTF transformation server
engine/core/              → AI providers, IDE runtime, orchestration
runners/                  → Background workers (aiWorker, authWorker)
infra/                    → Terraform + K8s manifests for OKE
agent/                    → Python FastAPI backend (Alice agent)
config/ai/                → System prompts, constitution
supabase/                 → Migrations, Edge Functions, local dev
prisma/                   → PostgreSQL schema
ui/                       → Shared UI components (shadcn/ui based)
```

### Architecture Philosophy

**Thin TS / Heavy Python**
- Browser (TS) = Fast I/O, real-time sync, IDE, UI
- Python = Deep reasoning, persistent memory, repo analysis, conversation
- SyncGuard = Bridge with priority-based batching

See [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) for full details.

---

## License

This project is **NOT Open Source**. All original components are **Proprietary** and **All Rights Reserved**. See [COPYRIGHT.txt](./COPYRIGHT.txt) for full terms.

---

<div align="center">

🌐 [dreammakerhub.website](https://www.dreammakerhub.website)

</div>
