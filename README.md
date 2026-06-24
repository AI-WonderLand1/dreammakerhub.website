# AI Wonderland

**Build anything. Just by describing it.**

AI Wonderland is a full-stack, AI-powered creative platform where you generate websites, 3D games, and interactive experiences from natural language prompts. No coding required — but full code access when you want it.

## In 30 seconds

Describe what you want → AI Architect plans it → AI Builder writes code → AI Reviewer polishes it → You publish it. Built-in 3D editor (PlayCanvas), visual page builder (Puck), cloud IDE (WonderSpace), and a persistent AI assistant (Spirit Guide).

## Attractions

### 🤖 WonderBuild — AI App Builder
Prompt-to-code generation with a multi-agent workflow. Pick your output: website, game, React component, 3D scene, or PlayCanvas world. Three AI agents (Architect → Builder → Reviewer) collaborate in real time.

### 🎮 WonderPlay — 3D Game Engine
Full PlayCanvas editor embedded in the browser. Create and edit 3D scenes, games, and spatial designs with drag-and-drop or AI prompts. NPC support (Convai), glTF transform, Draco compression, mesh optimization.

### 🧠 WonderSpace IDE
Browser-based IDE with Monaco Editor, WebContainer runtime (Node.js in the browser), terminal emulation, file system, and Git integration. Build and run code without leaving your browser.

### 🎨 Visual Page Builder (Puck)
Drag-and-drop editor with 19+ blocks (Hero, Text, Image, Video, Form, Tabs, Accordion, Carousel, etc.). AI-generated output converts to Puck blocks for further editing.

### 🧭 Spirit Guide AI Assistant
Persistent AI assistant on every page. Context-aware, remembers conversations across sessions (powered by mem0). Ask questions, get suggestions, or request code changes inline.

### 🌐 Cloud Workspaces (Coder + Kubernetes)
Spin up cloud development environments on your own infrastructure (OCI, AWS, GCP) or use hosted workspaces. VS Code in the browser, or connect your local editor.

### 🏪 Extensions & Asset Marketplace
Curated extension registry (Changelog Writer, Schema Guard, Design Tokens, AI Reviewer, Deploy Runner, Semantic Search, Telemetry Lens, Content Safety). 3D asset library with search and download.

### 🔐 Enterprise Features
SSO/SCIM, custom domains, role-based access (Owner/Editor/Viewer), team collaboration, usage analytics, audit logs, AetherGuard AI safety system.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript 6 |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| 3D | PlayCanvas, Three.js / R3F, WebGL Studio |
| AI | OpenAI, Gemini, Groq, OpenRouter |
| Database | PostgreSQL + Prisma + Supabase |
| Auth | Supabase Auth (SSR) |
| IDE | WebContainer API + Monaco + xterm.js |
| Infra | Docker, Kubernetes (OCI OKE), Coder |

## Pricing

- **Nomad** — Free (public projects, community support)
- **Architect** — $35/mo (private projects, priority AI)
- **Guild** — $149/mo (team seats, shared assets, analytics)
- **Enterprise** — Custom (SSO, dedicated infra, SLA)

## Quick Start

```bash
nvm use           # Requires Node >= 20.19
npm install --legacy-peer-deps
npm run dev       # http://localhost:3000
```

## Links

- [Homepage](https://dreammakerhub.website)
- [Documentation](/docs)
- [Community](/community)
- [Status](https://dreammakerhub.website/status)
