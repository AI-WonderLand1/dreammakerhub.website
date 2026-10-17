# HostBrr — Playground and NPC deployment

Status: Prepared in PR only. No service, secret or DNS changes occur by merging.

These optional services use the EXISTING DreamMakerHub Compose network and Caddy:
- Playground: ghcr.io/ai-wonderland1/ai-playground:<SHA>, private 127.0.0.1:5002, public playground.dreammakerhub.website
- NPC: ghcr.io/ai-wonderland1/npc-ai-sim:<SHA>, private 127.0.0.1:5003, public npc-ai-sim.dreammakerhub.website

GitHub image builds run on each project's main branch. Playground needs
VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY Actions variables for the same
Supabase project's PUBLIC URL/publishable key as the website. Never provide
the secret/service-role key as a frontend build argument.

Build both images, ensure the package images can be pulled from HostBrr
(GHCR may default to private), then use the full 40-character successful
build COMMIT SHA tags. Docker sha256 digests are not the input.

On HostBrr as wonderland, after this PR is merged into website Master:

    cd ~/hostbrr-web-staging
    git fetch origin Master
    git show origin/Master:deploy/hostbrr/compose.satellites.yaml > deploy/hostbrr/compose.satellites.yaml
    git show origin/Master:deploy/hostbrr/Caddyfile.public > deploy/hostbrr/Caddyfile.public
    cd deploy/hostbrr
    umask 077
    printf 'PLAYGROUND_IMAGE=ghcr.io/ai-wonderland1/ai-playground:%s\nNPC_IMAGE=ghcr.io/ai-wonderland1/npc-ai-sim:%s\n' \
      'PLAYGROUND_FULL_40_CHAR_COMMIT_SHA' 'NPC_FULL_40_CHAR_COMMIT_SHA' > satellites.env
    touch playground.runtime.env npc.runtime.env
    chmod 600 satellites.env playground.runtime.env npc.runtime.env

Replace the two placeholder SHAs with the real values from successful
image-build runs. The runtime.env files may be empty for PRIVATE smoke
tests only. This does NOT activate provider billing, live AI, memory
persistence or full-stack synchronization. Provide runtime secrets only
through your approved secret manager after limits have been verified.

Validate and stage privately, with no Caddy/DNS changes:

    free -h
    df -h /
    docker compose --env-file deployment.env --env-file satellites.env \
      -f compose.yaml -f compose.public.yaml -f compose.satellites.yaml config --quiet
    docker compose --env-file deployment.env --env-file satellites.env \
      -f compose.yaml -f compose.public.yaml -f compose.satellites.yaml pull playground npc
    docker compose --env-file deployment.env --env-file satellites.env \
      -f compose.yaml -f compose.public.yaml -f compose.satellites.yaml up -d --no-deps playground npc
    curl -fsS http://127.0.0.1:5002/api/health
    curl -fsS http://127.0.0.1:5003/api/health

Stop here if either health check fails; do NOT update DNS or restart Caddy.
Do not expose ports 5002/5003 beyond localhost.

After BOTH pass, apply the reviewed Caddyfile.public route changes:

    docker compose --env-file deployment.env --env-file satellites.env \
      -f compose.yaml -f compose.public.yaml -f compose.satellites.yaml up -d --no-deps --force-recreate caddy

Verify https://dreammakerhub.website still works, then change ONLY the two
satellite subdomain DNS records to HostBrr 89.106.73.109.
Leave apex/www, email, Coder and all unrelated DNS unchanged.
Obtain valid origin SSL certificates before enabling Cloudflare proxy and
Full (strict). Do NOT disable TLS verification.

For subsequent releases use the website repository's manual workflow
"Deploy HostBrr satellite", which reuses the existing website SSH deployment
secrets. Select playground or npc and a successful main image SHA.
It changes only the chosen satellite, validates its health, and attempts
rollback without restarting the main DreamMakerHub website.

RAM quotas: Playground 900 MiB, NPC 1200 MiB, existing website cap 5 GiB,
on an 8 GiB VPS. Monitor RAM and restarts before serving customers.
No GPU, local database, separate billing webhook, or memory sidecar
is installed. Existing customer projects are untouched.

The release script safely creates a missing selected-service `.runtime.env` as an empty mode-600 regular file for UI-only startup. Existing configuration is never overwritten; symlinks and incorrectly permissioned files are rejected. This permits the login UI to start but does not provision server credentials or enable provider/billing features.
