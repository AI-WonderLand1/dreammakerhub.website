# HostBrr 8 GB VPS — DreamMakerHub web migration (manual, staged)

**Status:** Prepared in GitHub only. No HostBrr console access, server IP, SSH keys,
live DNS updates or production secrets are included. Merging does not deploy.

## Scope and limits

The paid `EPYC-8GBrr` VPS was ordered at **$7.50 per month**, but
activation and access must be confirmed in the HostBrr control panel. The
previously selected plan advertised 4 shared vCPUs, 8 GB RAM, 80 GB NVMe
and included IPv4; confirm these after activation. These files run **only
the DreamMakerHub Next.js website/API**, reusing a prebuilt GHCR image.

- Keep **Supabase** (Auth/Postgres/Storage) external. Never create a new local
  Postgres container or silently overwrite existing databases.
- **No Alice local inference, GPU job servers, extra app repos, or customer
  Coder pods** on this first deployment. `BILLABLE_OPERATIONS_ENABLED`,
  `CODER_WORKSPACE_CREATION_ENABLED`,
  `CODER_CUSTOMER_PROVISIONING_ENABLED` and `FREE_BUILDER_AI_ENABLED`
  are forcibly false in Compose. This does **not** guarantee all older
  unmetered endpoints are safe. Review
  [COST_GUARD_ROLLOUT.md](../../docs/operations/COST_GUARD_ROLLOUT.md).
- **Do not migrate/disable `coder.dreammakerhub.website` or Coder databases**
  as part of this web deploy. The existing Google Cloud Coder instance and
  associated disks/workspaces require separate verified exports.
- The web container exposes *only* `127.0.0.1:5001` for private smoke tests.
  No public ports are opened by the base `compose.yaml`.
- Local uploads, embedded databases, containers, or VM disks on Google/Railway
  are **not** included in the website image. Verify backups and restores first.

## After HostBrr activation: host prerequisites

1. In **HostBrr > Services > Manage**, verify the server is **Active**, its
   public IPv4, operating system installation and console access. Do not pay
   again. Choose **Ubuntu 24.04 LTS x86_64** if available and not installed.
2. Set up a unique SSH public key. Verify the server's **SSH host-key
   fingerprint in HostBrr's console** before pinning it in local
   `~/.ssh/known_hosts`. Do not disable host-key checking or paste
   private SSH keys, root passwords, Stripe secrets or database URLs into chat.
3. Create a **non-root administrative/deploy user** and configure key-based
   login before disabling SSH password authentication. Open only SSH
   (ideally IP-restricted), 80 and 443 in the VPS firewall when needed.
   Keep **5000, 5001, 5432, 7080 and IDE ports closed** externally.
4. Install Docker Engine and the Docker Compose v2 plugin using
   [Docker's official Ubuntu guide](https://docs.docker.com/engine/install/ubuntu/).
   Do not give untrusted users access to the `docker` group: it grants
   root-equivalent privileges. Install `curl`, `git`, `ca-certificates`.
5. Check RAM, disk and CPU with `free -h`, `df -h`, `nproc`. Keep
   separate off-server backups. Confirm HostBrr's bandwidth/overage policy
   and cancellation/renewal settings.

## Prepare application source and secrets

After the PR has merged to `Master`, obtain an image built from a **successful
[Build & Push Web Image](../../.github/workflows/web-image.yml)** workflow on
`Master`. Use its exact **40-character commit SHA**, not the moving
`:latest` tag. The current Dockerfile builds on GitHub; do **not** compile
the large Next.js monorepo on an 8 GB production VPS.

On the VPS, clone the repository (no secrets in this Git checkout):

```bash
git clone --branch Master https://github.com/AI-WonderLand1/dreammakerhub.website.git ~/dreammakerhub.website
cd ~/dreammakerhub.website/deploy/hostbrr
cp deployment.env.example deployment.env
chmod 600 deployment.env
# Edit deployment.env to set WEB_IMAGE=ghcr.io/ai-wonderland1/dreammakerhub-website:<exact-built-40-character-SHA>
```

Create `deploy/hostbrr/runtime.env` **privately on the server** (mode
`0600`), using an approved secret manager or a verified encrypted SSH/SCP
transfer from the existing deployment. Never fill it with example/dummy
production secrets, put it in GitHub, paste it into chat, echo it to logs,
or use `docker compose config` without `--quiet`. This directory's
`.gitignore` excludes both runtime and deployment env files.

At minimum, the runtime environment must have the actual names/values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the project's existing
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` (or the existing `SUPABASE_SERVICE_ROLE_KEY`)
- `DATABASE_URL`

Also provision **only** the genuinely needed application secrets from the
existing approved configuration, e.g. auth, Stripe and AI provider keys.
Make sure any production Stripe webhook endpoint still goes to **one**
verified production origin after cutover; do not point a second live
listener at Stripe. Preserve token/metering feature flags in fail-closed
mode until verified. Check OAuth redirect URLs, Cloudflare, Supabase Auth
allowed redirects, and any provider allowlists before enabling real login.

**Important build-time limitation:** `NEXT_PUBLIC_*` browser configuration
is baked into the GitHub image. If the project URL or public key changes,
build a **new tagged image**; editing `runtime.env` alone is insufficient.

If the GHCR package is private, authenticate the Docker client using a
**read-only package credential** through `docker login ghcr.io` without
placing tokens on the command line or in Git. Do not use a personal
write-scope token when a read-only credential will work.

## Deploy privately, without touching production

```bash
cd ~/dreammakerhub.website/deploy/hostbrr
bash deploy.sh
```

This script checks that secrets exist **without printing values**, validates
an immutable image tag, pulls the already-built image, starts **only the
website**, then tests:

- `http://127.0.0.1:5001/health`
- `http://127.0.0.1:5001/api/config/supabase` (HTTP 200 expected)
- `http://127.0.0.1:5001/` (HTTP 200 expected)

For private local verification from your Linux laptop, use an SSH tunnel.
Keep the SSH command open in its terminal:

```bash
ssh -N -L 5501:127.0.0.1:5001 YOUR_DEPLOY_USER@YOUR_HOSTBRR_IP
# Open http://127.0.0.1:5501/health in your local browser.
```

**Do not treat a healthy homepage as proof that authentication, publishing,
billing, storage or Alice work.** These require separate staging tests on
a valid HTTPS hostname with appropriate OAuth/provider configuration.

## Production cutover: only with approval and passing tests

1. Verify actual HostBrr console access, firewall rules, memory use, pinned
   image SHA, service logs (redact secrets), API health, Supabase Auth,
   project save/read and user data consistency.
2. Restore/verify uploaded data and any non-Supabase persistence needed for
   the website. Do **not** delete Google/Railway/Coder resources.
3. Choose a separate **HTTPS staging hostname** first if you need to test
   OAuth cookies, Stripe flows and project publishing realistically.
4. When the owner explicitly approves public cutover, update Cloudflare
   website `A`/`CNAME` records for `dreammakerhub.website` and `www`
   and then start the **optional** HTTPS Caddy overlay:
   ```bash
   cd ~/dreammakerhub.website/deploy/hostbrr
   docker compose --env-file deployment.env -f compose.yaml -f compose.public.yaml config --quiet
   docker compose --env-file deployment.env -f compose.yaml -f compose.public.yaml up -d
   ```
   The included `Caddyfile.public` is for **the real production domain**
   only. Caddy certificate issuance requires publicly resolvable DNS and
   ports 80/443. When using Cloudflare proxy, test end-to-end TLS in
   **Full (strict)** mode. Do not switch DNS blindly.
5. Recheck all routes from outside, proper forwarded HTTPS requests,
   valid certificates, authentication, project storage, billing webhooks
   and rollback. Leave Zoho MX, SPF, DKIM and mail records alone.
6. Roll back by reverting only the **website** DNS and any authorized
   webhook destination changes, preserving data and prior infrastructure.

## Resource and cost constraints

- Host: 8 GB RAM. The web container is capped at **5 GB RAM and 3 CPU**
  and logs are rotated. Other host processes and a future IDE still require
  resources; do not enable more than **one** small Coder workspace until
  load testing and workload isolation pass. This deploy includes **zero**
  Coder workspaces.
- GPU is **not included** in the $7.50 VPS. Rent GPU only after measured
  testing and explicit per-job cost caps; do not silently start billable
  endpoints.
- This server's monthly hosting invoice is not a hard cap on storage,
  backup, outbound bandwidth or third-party API charges.
- Before any rollback or redeploy, preserve the last good image SHA and
  separately back up persistent files. Never `docker compose down -v`
  on a system that stores important data in volumes.

## When HostBrr is still pending

No server action is possible without an active VPS and SSH access. The
repository deployment can be reviewed, merged and the GHCR image prepared
in advance. **Nothing in this directory automatically activates HostBrr,
moves the site, changes Cloudflare, or migrates databases.**
