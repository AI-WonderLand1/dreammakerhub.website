# DreamMakerHub Deep-Dive Addendum — 2026-08-30

## Executive update

Repository discovery now confirms connected access to `dreammakerhub.website`, `AI-PLAYGROUND`, and `NPC-AI-SIM` (the renamed former WonderPlay 3D repository). No newer application commit was observed in `dreammakerhub.website` after the 2026-08-29 deployment commits. AI-PLAYGROUND has a 2026-08-28 deployment-workflow commit; NPC-AI-SIM's latest observed commits are the 2026-08-28 rename sequence.

## 1. NPC-AI-SIM rename is confirmed

GitHub identifies `AI-WonderLand1/NPC-AI-SIM` as the current repository. Its latest observed commits on 2026-08-28 are the project/README rename sequence. DreamMakerHub also contains commit `fb4f7a58` updating references from WonderPlay 3D to NPC-AI-SIM. Future traces should use NPC-AI-SIM as the canonical repository name. Old `wonderplay-3d` hostnames remain a separate cleanup item.

## 2. AI-PLAYGROUND Wonderland-key authorization is a static allowlist

`server/wonderland-keys.ts` constructs a Set from the comma-separated `WONDERLAND_KEYS` environment variable. There is no issuance, rotation, database lookup, user mapping, or Stripe entitlement lookup in that module. If no keys are configured, it warns that `/api/chat` will reject requests.

`server/index.ts` requires `wonderlandKey` in the request body for `/api/chat` and `/api/chat/stream`, rejects missing keys with 401, rejects invalid keys with 403, then calls the provider registry. Separate 60/minute chat and 30/minute stream rate limits are applied.

Conclusion: the DreamMakerHub-to-AI-PLAYGROUND commercial contract remains unresolved for a precise, source-backed reason: AI-PLAYGROUND currently authorizes requests with a static server-side key allowlist, not a DreamMakerHub account entitlement.

## 3. AI-PLAYGROUND deployment workflow remains rsync-only

`AI-PLAYGROUND/package.json` defines Vite build, Express server, and production start scripts. The current `.github/workflows/deploy.yml` only SSHes to `209.50.53.112` and rsyncs the repository to `/var/www/html/`. It does not install dependencies, build the Vite application, start the Express server, or restart a process manager.

The actual service/process definition on the target host is therefore an unresolved dependency. No assumption is made about whether PM2, systemd, Docker, or another process manager is used because the live host is outside repository evidence.

## 4. UpCloud Compose stack does not contain AI-PLAYGROUND or NPC-AI-SIM

`deploy/upcloud/docker-compose.yml` defines Coder, Coder PostgreSQL, the DreamMakerHub Next.js web container, GLTF optimizer, nginx, and Certbot. It does not define AI-PLAYGROUND or NPC-AI-SIM services.

Therefore the cross-repository services are not proven to be part of the same Compose deployment. Their production runtime/deployment paths must be traced separately.

## 5. UpCloud Coder stack has persistent DB storage but the deploy workflow still overwrites `.env`

The Compose file persists Coder PostgreSQL in the `coder-db-data` named volume and injects Supabase, database, OpenRouter, NextAuth and Coder configuration into containers through environment interpolation.

The deployment workflow still executes `cp deploy/upcloud/.env.example .env` immediately before Docker Compose startup. Because the checked-in example contains placeholders, this remains a P0 risk if the VM's `.env` is intended to hold live configuration.

## 6. TLS coverage remains unproven for all nginx hostnames

The certificate workflow requests root/www/coder/ide/wildcard-coder/ai certificates, while nginx also names `play`, `playground`, `wonderplay-3d`, and `civo-test`. Source proves that DNS-01/Certbot renewal exists, but does not prove that every nginx hostname is covered by the mounted certificate. Live DNS and certificate verification is still required.

## 7. NPC-AI-SIM live WebSocket remains partially implemented

`server.ts` dynamically imports `ws`, creates `WebSocketServer({ noServer: true })`, and registers a connection handler. The connection handler sends an initial viseme frame and then randomized viseme values on a timer. The inspected source still does not establish an HTTP `upgrade` handler calling `wss.handleUpgrade`.

The same server contains real Gemini-backed tactical reasoning, image perception, and video analysis endpoints. Those are distinct from the live WebSocket loop. The runtime dependency for `ws` remains an unresolved manifest/lockfile check because the prior audit found `@types/ws` without a matching runtime dependency.

## 8. Commercial readiness

The ecosystem has real provider routing, real rate limits, real Stripe webhook infrastructure, real AI execution, and real deployment configuration. The missing piece is the canonical commercial bridge: DreamMakerHub subscription/entitlement -> AI-PLAYGROUND authorization -> usage/billing. No evidence found today shows DreamMakerHub issuing or mapping a Wonderland key for a subscribed user.

## Priority changes

### P0
1. Remove/replace deployment-time `.env.example` overwrite after verifying the VM secret-management model.
2. Verify live Cloudflare DNS and TLS coverage for every nginx hostname.
3. Prove the actual AI-PLAYGROUND production process after rsync.
4. Establish one canonical commercial entitlement source before mapping DreamMakerHub users to AI-PLAYGROUND authorization.

### P1
5. Replace static Wonderland-key authorization with authenticated service-to-service/user entitlement mapping, or explicitly design a secure key issuance system.
6. Prove NPC-AI-SIM HTTP upgrade handling and `ws` runtime availability.
7. Reconcile old WonderPlay 3D hostnames after repository rename.
8. Complete Stripe entitlement/usage enforcement and sponsor collection flow.
9. Continue Coder identity, mobile, and pipeline-to-engine traces.

## Evidence

- `AI-WonderLand1/NPC-AI-SIM` repository and 2026-08-28 rename commits.
- `AI-WonderLand1/AI-PLAYGROUND/server/wonderland-keys.ts`.
- `AI-WonderLand1/AI-PLAYGROUND/server/index.ts`.
- `AI-WonderLand1/AI-PLAYGROUND/package.json`.
- `AI-WonderLand1/AI-PLAYGROUND/.github/workflows/deploy.yml`.
- `AI-WonderLand1/dreammakerhub.website/.github/workflows/deploy-upcloud.yml`.
- `AI-WonderLand1/dreammakerhub.website/deploy/upcloud/docker-compose.yml`.
- `AI-WonderLand1/NPC-AI-SIM/server.ts`.
