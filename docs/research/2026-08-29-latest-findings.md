# DreamMakerHub Deep-Dive Addendum — 2026-08-29

## Executive update

Today’s trace focused on the newest deployment commits and the unresolved cross-repository/runtime chain. The DreamMakerHub repository moved materially toward an UpCloud + Docker Compose deployment, but the deployment documentation and automation are not yet internally consistent enough to call the migration production-verified.

## 1. UpCloud migration is now active in source, but DNS state is stale/inconsistent

The latest DreamMakerHub commits are `71d3d249` (`dns upcloud`) followed by `71aac058` (`redirect lloop nginx`). The nginx configuration now routes the public application hostnames through `web:5000` and Coder/IDE hostnames through `coder:7080`, with WebSocket upgrade headers enabled. The HTTP listener redirects when `X-Forwarded-Proto` is not HTTPS.

The deployment README still says the main public domains remain on Railway and need migration, while the newest commits indicate that DNS migration work has begun. This documentation is therefore stale and must be reconciled with the actual Cloudflare records and deployment state.

## 2. Critical deployment automation risk: production `.env` is overwritten from `.env.example`

`.github/workflows/deploy-upcloud.yml` triggers on pushes to `main`, SSHes to the UpCloud VM, runs `git pull origin main`, then executes `cp deploy/upcloud/.env.example .env` before `docker compose ... up -d --build`.

The checked-in `.env.example` contains placeholder values such as `your-upcloud-api-key`, `change-me-to-a-strong-password`, `https://your-project.supabase.co`, and blank Stripe/API credentials. If the server’s `.env` is the source of its live configuration, this deployment step can replace valid production configuration with placeholders on every main-branch deployment. This must be verified against the actual server/environment model and fixed before relying on automated production deployment.

## 3. TLS certificate coverage is incomplete relative to nginx hostnames

The nginx HTTPS server names include `dreammakerhub.website`, `www`, `play`, `playground`, `wonderplay-3d`, `civo-test`, and `ai`. The GitHub Actions certificate request currently requests certificates for the root, www, coder, ide, wildcard coder, and ai domains, but not `play`, `playground`, `wonderplay-3d`, or `civo-test`.

The same nginx certificate path is used for the public hostnames. Unless the certificate is separately provisioned/updated elsewhere, these additional names are not proven to be covered. This is a deployment/TLS verification blocker, not merely documentation debt.

## 4. AI-PLAYGROUND deployment workflow does not match its production README

`AI-PLAYGROUND/.github/workflows/deploy.yml` triggers on `main`, SSHes to `209.50.53.112`, and uses `rsync --delete` to copy the repository into `/var/www/html/`. It does not run `npm install`, `npm run build`, start/restart the Express server, or run the production server command described by its README. The README says production is a Node-running deployment and provides `npm run build` plus Railway/PM2 deployment paths.

Therefore the current GitHub Actions workflow is not sufficient by itself to prove that the actual Express + Vite application is being deployed and restarted. The deployment target and process manager need to be traced next.

## 5. AI-PLAYGROUND package confirms a server process is required

The package defines `server`, `start`, and `build` scripts, with Express/tsx as runtime tooling. The application is not a static-only Vite site. This makes the rsync-only workflow especially important to verify.

## 6. NPC-AI-SIM live WebSocket blocker remains confirmed

The current `NPC-AI-SIM` package contains `@types/ws` only in devDependencies and has no `ws` runtime dependency. Its `server.ts` dynamically imports `ws` and constructs `WebSocketServer({ noServer: true })`, but the inspected source still does not show the HTTP upgrade handler needed to call `wss.handleUpgrade`.

DreamMakerHub’s `/api/npc/live` expects `https://npc-ai-sim.dreammakerhub.website/live-npc?id=...`. The deployment chain is therefore still unproven end-to-end.

## 7. Cross-repository commercial AI contract remains unresolved

DreamMakerHub’s current architecture has its own Supabase/Stripe entitlement model. AI-PLAYGROUND requires a `wonderlandKey` before chat/stream model calls. No new source evidence today proves an authenticated DreamMakerHub user is automatically issued or mapped to a valid Wonderland key. This remains the next cross-repository commercial contract to trace.

## 8. Current DreamMakerHub nginx configuration does support WebSocket proxying

The newest nginx configuration forwards `Upgrade` and `Connection: upgrade` headers for the public web service and Coder service. This is positive infrastructure evidence, but it does not prove that the downstream application actually accepts the required WebSocket upgrade.

## 9. Priority changes

### New P0
1. Verify how production `.env` is managed; remove the automated `cp .env.example .env` overwrite if the VM uses a persistent live `.env`.
2. Verify TLS certificate SAN coverage for every nginx public hostname.
3. Verify Cloudflare DNS records against the new UpCloud deployment rather than relying on stale README status.
4. Prove AI-PLAYGROUND production process/deployment after the rsync workflow.

### Existing P1 carried forward
5. Prove NPC-AI-SIM WebSocket upgrade handling and install/runtime-provide `ws` if required.
6. Trace DreamMakerHub identity -> Wonderland key -> AI-PLAYGROUND provider -> usage/billing.
7. Reconcile stale `wonderplay-3D` hostnames after the repository rename.
8. Complete canonical Stripe entitlement and usage enforcement.
9. Resolve proprietary README vs MIT license contradiction.
10. Complete mobile build/API/EAS verification.

## Evidence

- DreamMakerHub latest commit: `71aac05888074dcf6dce8fc0a8b01bc7d7387c64`
- DreamMakerHub parent: `71d3d2498ef4be69d26d02345a5aad936f3806fc`
- AI-PLAYGROUND deploy workflow: `.github/workflows/deploy.yml`
- AI-PLAYGROUND package manifest: `package.json`
- NPC-AI-SIM package manifest: `package.json`
- NPC-AI-SIM server: `server.ts`
