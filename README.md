## DreamMakerHub.website

-  DreamMakerHub is the main AI Wonderland platform repository. It owns the account and project shell, WonderBuild website builder, project tooling, cloud-development integration, platform APIs, and the main 3D/world-authoring surface.

## Repository role

This repository contains:

- authentication and project entry flows
- dashboard and project management
- project-scoped files and code tooling
- WonderBuild website builder
- cloud IDE/workspace integration
- platform APIs and deployment integration
- 3D/world-authoring tooling powered by PlayCanvas/WebGL in the current DreamMakerHub runtime

# Related repositories:

- `AI-PLAYGROUND` owns multi-model AI and visual workflow/orchestration tooling.
- `NPC-AI-SIM` owns NPC cognition, personality, perception, memory, actions, voice configuration, and NPC brain/runtime contracts.
- `vanguard-engine` is a separate engine project under development and is not the current DreamMakerHub 3D Studio runtime. and will eventually be intergraded into my 3D

These boundaries are intentional. The specialized repositories integrate with DreamMakerHub instead of duplicating the whole platform.

## WonderBuild product model

# WonderBuild is being consolidated around one three-step website-building flow:

```text
LOGIN / REGISTER
      ↓
DASHBOARD / PROJECTS
      ↓
1. START
   - Blank website
   - Choose template
   - Generate with AI
      ↓
2. BUILD
   - Drag/drop
   - AI editing
   - Pages / CMS / assets / components
   - Code when needed
   - Preview inside the editor
      ↓
3. PUBLISH
   - Domain
   - SEO / validation
   - Go live
```

Authentication and project selection are outside the three builder steps. Internal work such as project creation, autosave, revisions, adapters, and deployment plumbing should not become extra user-facing steps.

### WonderBuild 3D guardrail

WonderBuild is a website builder, not a game/world editor.

It can use images, video, generated graphics, GLB/GLTF models, product viewers, and simple interactive 3D web components as normal website content. Game-level editing, gameplay systems, physics authoring, and NPC simulation belong outside WonderBuild.

See [`todo.md`](todo.md) for prioritized launch blockers and release acceptance criteria. The former detailed TODO remains available in Git history.

## Tech stack

The repository is an npm-workspace monorepo built primarily with:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Supabase
- Stripe
- dnd-kit
- Monaco / WebContainers
- Three.js
- PlayCanvas
- Kubernetes/Coder integration

## User documentation

The customer-facing guide is maintained in [docs/USER_GUIDE.md](docs/USER_GUIDE.md) and the live /docs page.

It covers:

- how to navigate Build, Code, 3D, Projects, Docs, and Account
- what the major project, WonderBuild, WonderSpace, AI, and 3D buttons do
- which outside services can be connected and what each service is used for
- which capabilities belong to this repository versus AI-PLAYGROUND and NPC-AI-SIM
- live, gated, operator-managed, and configuration-only behavior

Repository ownership summary:

| Repository | Owns |
| --- | --- |
| dreammakerhub.website | Main account/dashboard, projects, WonderBuild, WonderSpace/Coder, main 3D hub, central billing/usage/provider settings |
| AI-PLAYGROUND | Multi-model chat, model directory, agents, workflow canvas/templates, provider routing |
| NPC-AI-SIM | NPC brain authoring, personality, memory, perception, voice, actions, training, export/runtime contracts |

## Local development

### Requirements

- Node.js 22.12.0 or newer supported LTS (see [`.nvmrc`](.nvmrc); required by Vitest 5)
- npm

### Install

```bash
git clone https://github.com/AI-WonderLand1/dreammakerhub.website.git
cd dreammakerhub.website
npm install
cp .env.example .env.local
```

Configure the services you intend to use, then run:

```bash
npm run dev
```

Build and test with:

```bash
npm run build
npm test
```

## Production deployment

The current main-site production path is GitHub Actions + GHCR + UpCloud:

```text
Master
  ↓
Build & Push Web Image
  ↓
GitHub Container Registry
  ↓
Deploy Main Site to UpCloud VM
  ↓
Docker Compose
  ↓
health checks
  ↓
public HTTPS verification
```

Relevant files:

- [`.github/workflows/web-image.yml`](.github/workflows/web-image.yml)
- [`.github/workflows/deploy-upcloud.yml`](.github/workflows/deploy-upcloud.yml)
- [`deploy/upcloud/docker-compose.yml`](deploy/upcloud/docker-compose.yml)

## Current status

This repository is under active development. WonderBuild is still being consolidated around its canonical three-step experience, and external integrations depend on the matching services being configured in the deployment environment.

The website builder and the 3D/world tooling are separate product surfaces even though they live in the same platform repository.

## Security

See [`SECURITY.md`](SECURITY.md) for vulnerability reporting and security policy. Do not commit real credentials, keep privileged service configuration on the server, and review database/internal-service network exposure before production deployment.

## License

Prosperity Public License 3.0.0. See [`LICENSE`](LICENSE) for the full terms.

## Sponsorship

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y61YK1ZX)

See [`SPONSORSHIP.md`](SPONSORSHIP.md) for the founding sponsorship program.
