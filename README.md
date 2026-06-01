# Ai-Wonderland (DreamMakerHub)
AI-powered creative platform for building web experiences, 3D worlds, and interactive apps.

# Current Status: Under Maintenance

# 🌐 Visit the Site | ☕ Support the Project
 # https://www.dreammakerhub.website

# 🛡️ Proprietary Notice & Licensing
This project is NOT Open Source. All original components, including the AI Constitution, the Alice & Rick Personas, and the custom-merged PlayCanvas/WebGL engine logic, are Proprietary and All Rights Reserved.

Viewing: You are welcome to review the source code for educational purposes and portfolio evaluation.

Restrictions: Unauthorized cloning, redistribution, or commercial use is strictly prohibited. See COPYRIGHT.md for full legal terms.

# DreamMakerHub AI Platform
## A next-generation AI-powered creation platform built to help developers, creators, and
innovators build intelligent applications, automate workflows, and explore advanced AI tools -
all inside a unified, modern web experience.
DreamMakerHub combines AI agents, 3D experiences, automation, and developer-friendly
tools into one cohesive ecosystem.
# Features Overview
▪ AI Agents with Reasoning - Autonomous agents capable of planning, memory, and multi-
step workflows.
▪ AI Playground (WonderSpace) - Chat, test prompts, run agents, and explore models
interactively.
▪ 3D Engine Integration - PlayCanvas/WebGL-powered 3D editor for immersive experiences.
▪ Full SaaS Platform - Authentication, subscriptions, dashboards, and user management.
▪ Developer Tools - API routes, internal tooling, testing, linting, and monorepo automation.
▪ Modern Web Stack - Next.js, React, TypeScript, Tailwind, Supabase, Stripe, Kubernetes, and
more.
# Tech Stack
Frontend
▪ Next.js (App Router)
▪ React + TypeScript
▪ TailwindCSS
▪ Puck Editor
▪ Custom UI components

Backend / Infra
▪ Node.js
▪ Supabase (Auth, DB, Storage)
▪ Prisma
▪ REST APIs
▪ Kubernetes (OKE)
▪ Coder Workspaces
▪ CI/CD automation
AI / 3D
▪ Custom AI reasoning engine
▪ Multi-agent orchestration
▪ PlayCanvas / WebGL 3D engine
▪ Prompt builder + safety scanners
Copilot may make mistakes 3
Repository Structure
``` dreammakerhub.website/
│
├── apps/
│ └── web/ # Next.js frontend
│ ├── ai-modules/ # AI tools, agents, builders
│ ├── app/ # App Router pages
│ ├── api/ # API routes
│ ├── lib/ # Utilities
│ └── services/ # Client-side services
│
├── engine/
│ └── core/ # AI runtime, memory, reasoning, scanners
│
├── infra/ # Supabase, logging, rate limiting, integrations
│
├── ui/
│ └── components/ # Reusable React components
│
├── docs/ # API docs, OpenAPI, typedoc
│
└── config/
└── ai/ # Model configs, agent presets 
```
# Getting Started

# 1. Clone the repository
git clone https://github.com/AI-WonderLand1/dreammakerhub.website
cd dreammakerhub.website

# 2. Install dependencies
npm install

# 3. Set environment variables
Create a .env.local file:
SUPABASE_URL=
SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
OPENAI_API_KEY=
PLAYCANVAS_API_KEY=

# 4. Run the development server
npm run dev

# AI Playground (WonderGround)
WonderSpace is your Dify-style AI playground, featuring:
▪ Multi-model chat
▪ Agent workflows
▪ Prompt builder
▪ Memory + reasoning engine
▪ Safety + moderation layer
▪ Session history
***
## ⚡ Getting Started
### **1. Clone the repository**
git clone https://github.com/AI-WonderLand1/dreammakerhub.website cd
dreammakerhub.website

### **2. Install dependencies**
npm install

### **3. Set environment variables**
Create a `.env.local` file:
SUPABASE_URL= SUPABASE_ANON_KEY= STRIPE_SECRET_KEY= OPENAI_API_KEY=
PLAYCANVAS_API_KEY=

### **4. Run the development server**
npm run dev
Copilot may make mistakes 5
***
## AI Playground (WonderSpace)
WonderSpace is your **Dify-style AI playground**, featuring:
- Multi-model chat
- Agent workflows
- Prompt builder
- Memory + reasoning engine
- Safety + moderation layer
- Session history
***
## 3D Engine Integration
DreamMakerHub includes a full **PlayCanvas/WebGL 3D editor**:
- Scene editor
- Asset pipeline
- Real-time rendering
- Integration with AI agents for procedural generation
***
## Testing & Tooling
- ESLint + Prettier
- Type checking
- Automated builds
- Internal scripts for monorepo management
***
## Billing & Authentication
- Supabase Auth
- Stripe subscriptions
- Role-based access control
- Secure API routing
***
