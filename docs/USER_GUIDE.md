# AI WONDERLAND User Guide

This guide explains how to navigate the AI WONDERLAND website, what the main buttons do, which outside services can be connected, and which repository owns each capability.

> Status rule: a visible route or button does not prove every external dependency is enabled. When a provider, cloud service, runtime bridge, or operator setting is unavailable, the product should say so instead of pretending the feature is live.

## Quick start

1. Sign in to your AI WONDERLAND account.
2. Open Dashboard / Projects.
3. Create or select a project.
4. Choose the product area that matches the project:
   - Build: WonderBuild for websites and web apps.
   - Code: WonderSpace for project files, history, and the optional private Coder IDE.
   - 3D: WonderPlay / 3D Hub for scenes, assets, generation, and NPC-related tools.
   - AI Playground: multi-model chat, agents, models, and visual workflows.

## Global navigation

| Item | What it does |
| --- | --- |
| Build | Opens WonderBuild. Start from a template, AI generation, or blank site, then edit and publish. |
| Code | Opens WonderSpace. Use project files first; open the optional private IDE from a selected project. |
| 3D | Opens WonderPlay / 3D Hub for realtime 3D work. |
| Projects | Returns to the project dashboard. |
| Docs | Opens the product documentation. |
| Account | Opens account settings. |
| AI Playground | Opens the separate AI-PLAYGROUND app. |
| Blog / Community | Opens product updates or community surfaces when enabled. |

## Project navigation

A selected code/workspace project has one project navigation bar.

| Button / tab | What it does |
| --- | --- |
| Files & Code | Opens the project file manager and code editor. |
| IDE | Opens the WonderSpace IDE page for this project. Existing IDEs and the create form live on the same page. |
| Issues | Opens issues for the selected project. |
| Agents | Opens AI agent tools with project context when supported. |
| Discussions | Opens project discussions. |
| Projects | Returns to the project/dashboard view while preserving project context. |
| History | Opens saved source/version history from project files. |
| Wiki | Opens the project wiki. |
| Security | Opens the project security/AetherGuard area. |
| Insights | Opens usage and insight information. |
| Settings | Opens settings with the current project context. |

## WonderSpace private IDE

WonderSpace keeps My IDEs and Create a WonderSpace IDE on one project IDE page.

| Field / button | What it does |
| --- | --- |
| Repository | Uses the current AI WONDERLAND project as the source, or starts a blank workspace when that option is selected. |
| Machine type | Chooses an operator-approved Coder machine profile. Current customer profiles are Micro (1 CPU / 2 GiB) and Standard (2 CPU / 4 GiB). |
| Workspace name | Sets the Coder workspace name. A safe unique name is generated automatically. |
| Create IDE | Reserves the user's workspace slot and asks Coder to create the private workspace. |
| Open IDE | Opens the saved Coder code-server app after the workspace is ready. |
| Edit resources | Changes the real saved machine profile and restarts or rebuilds the workspace when required. |
| Delete | Requests deletion of the exact owned workspace. The saved slot is not released until deletion is confirmed. |
| Refresh | Reloads the saved IDE list from the server. |

GPU / VRAM: the current Google Docker Coder template does not expose a GPU or VRAM parameter. A VRAM control should not appear until a GPU-enabled template is published.

Repository rule: customer IDE creation uses AI WONDERLAND project context. GitHub is used by the platform for source control and CI, but the customer IDE form does not accept arbitrary GitHub repository URLs or tokens.

## WonderBuild

WonderBuild follows Template -> Build -> Publish.

| Button / area | What it does |
| --- | --- |
| Template / Start | Choose a template, start blank, or begin with AI. |
| Design / Build | Opens the visual editor. |
| Insert | Adds supported blocks and components to the page. |
| Pages | Creates, selects, renames, and manages pages in the current site. |
| Components | Opens reusable project components. |
| Assets | Opens project media and assets. |
| CMS | Opens structured content tools. |
| AI | Applies AI assistance to the selected element or supported builder task. |
| Desktop / Tablet / Mobile | Changes the responsive canvas breakpoint. |
| Grid / Snap | Toggles layout guides and snap behavior. |
| Preview | Switches from editing to preview mode. |
| Publish | Opens publish and export choices for the saved project. |
| Undo / Redo | Reverts or reapplies recent editor changes. |

A 3D model inserted into a website is treated as website content. Full game and world authoring stays in WonderPlay.

## WonderPlay / 3D

| Area | What it is for |
| --- | --- |
| 3D Studio / 3D Hub | Start and manage realtime 3D scenes, worlds, and game-oriented projects. |
| 3D AI Generator | Generate supported 3D assets through the configured 3D generation service. |
| 3D Asset Library | Browse and reuse saved 3D assets. |
| My NPCs / NPC-AI-SIM | Create and configure NPC brains and character behavior. |
| PlayCanvas editor bridge | Connect supported project and scene workflows to PlayCanvas editing. |

3D generation, PlayCanvas editing, and NPC runtime features have separate dependencies. A visible route does not mean every remote provider or runtime bridge is active.

## AI and agents

- Site assistant: page and project help plus supported assistant actions.
- Agent settings: configure provider and model choices available to the account.
- AI Playground: compare or use models, chat, build agents, and compose visual workflows.
- 3D AI: asset generation and rendering use the 3D usage and credit path rather than normal chat usage.
- NPC AI: NPC cognition belongs to NPC-AI-SIM and uses the central AI WONDERLAND billing and provider contract for real provider calls.

## Usage, billing, and alerts

AI WONDERLAND is the subscription and usage authority for all three repositories.

| Control | What it does |
| --- | --- |
| Plan / subscription | Shows the AI WONDERLAND membership associated with the account. |
| AI usage / credits | Tracks metered AI requests and credits used by supported AI features. |
| 3D usage / credits | Tracks GPU-heavy 3D generation and rendering separately. |
| Buy credits | Purchases configured AI or 3D credit packs through Stripe when enabled. |
| Usage alarms | Configures threshold alerts. Email uses Resend when configured; SMS uses Twilio when configured. |

AI-PLAYGROUND and NPC-AI-SIM do not own separate subscriptions.

## Outside services

| Service | Purpose | Status / rule |
| --- | --- | --- |
| Supabase | Sign-in, user and project data, realtime data, usage and billing records. | Core platform dependency. |
| PostgreSQL / Supabase Postgres | Project files, revisions, and server data. | Core platform dependency. |
| Stripe | Membership checkout, payment events, and configured credit packs. | Used when billing is enabled. |
| Coder | Creates and manages private browser IDE workspaces. | WonderSpace dependency. |
| Google Cloud | Current host for the Google Docker Coder workspace compute/template. | Operator-managed infrastructure. |
| OpenRouter | Multi-model routing option for AI features and AI Playground. | Requires configured server or account provider access. |
| OpenAI / Anthropic / Gemini / Groq / Cerebras and other providers | Optional model providers exposed through supported provider settings. | Availability depends on configured access. |
| PlayCanvas | 3D scene and editor integration. | Used by supported 3D workflows. |
| Mem0 | Optional semantic AI and NPC memory. | Server-side optional integration. |
| MongoDB | Optional durable AI and NPC memory archive. | Server-side optional integration. |
| n8n | Optional webhook and automation workflows. | Requires configured webhook or API access. |
| Amplitude | Product and AI analytics when configured. | Operator-managed. |
| Resend | Email usage and billing alerts. | Optional. |
| Twilio | SMS usage and billing alerts. | Optional. |
| GitHub / GHCR | Source control, pull requests, CI/security checks, and container images. | Developer/platform infrastructure; not arbitrary customer IDE repository input. |
| Cloudflare / DNS provider | Public DNS, proxy, and domain routing when configured. | Operator-managed infrastructure. |

Never paste server secrets into browser-visible fields unless that UI is explicitly a server-side encrypted credential vault.

## Repository ownership

### dreammakerhub.website

Owns the main AI WONDERLAND website and shared account/platform layer:

- authentication and account shell
- dashboard and projects
- project files, issues, discussions, wiki, history, security, insights, and settings
- WonderBuild website/app builder
- WonderSpace project IDE launcher and Coder integration
- main 3D/WonderPlay hub and PlayCanvas bridge
- 3D asset generation and library surfaces
- central subscriptions, usage, credit packs, and alarms
- provider/account settings and cross-repository billing/provider contracts

### AI-PLAYGROUND

Owns:

- model directory and model selection
- multi-model chat
- visual AI/workflow canvas
- templates and workflow library
- agent builder and encrypted provider credential vault
- provider routing
- AI usage routed to the central AI WONDERLAND billing service

It does not own WonderBuild, customer Coder workspaces, the main 3D studio, or NPC cognition authoring.

### NPC-AI-SIM

Owns:

- identity and role
- AI brain/model configuration
- personality
- memory
- perception
- knowledge/RAG configuration
- voice/dialogue configuration
- actions and capabilities
- animation bindings
- training and skills
- brain export and runtime-target configuration

The authoritative game/runtime bridge is separate. NPC-AI-SIM can configure or simulate a brain without claiming that a game-engine action actually executed.

## What is possible across the platform

A user can create a project, build a website or web app, manage project files and versions, create private cloud IDE workspaces, use AI models and agents, compose AI workflows, create or generate 3D assets, work with 3D project tools, configure NPC brains, track AI and 3D usage, purchase supported credit packs, and move between the three product repositories through the AI WONDERLAND platform.

Features that depend on a provider, cloud service, GPU, runtime bridge, or operator setting only work when that dependency is actually configured.