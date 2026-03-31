# Customer IDE Distribution (GitHub Codespaces-Style)

This project now supports building a customer-ready Theia image directly from repository root.

## Build the image

```bash
docker build -t theia-ide -f browser.Dockerfile .
```

## Run locally

```bash
docker run --rm -p 3000:3000 theia-ide
```

Open `http://localhost:3000`.

## Persistent workspace (recommended)

Use Docker volumes so customer files survive container restarts:

```bash
docker run --rm -p 3000:3000 \
  -v theia-workspace:/home/theia/workspace \
  -v theia-config:/home/theia/.theia \
  theia-ide
```

## Production pattern for "Codespaces-like" multi-user hosting

For customer distribution, run **one container per user/workspace** behind a gateway.

1. **Gateway service** authenticates customer users (OAuth/SAML/JWT).
2. Gateway spawns a dedicated container from `theia-ide` with:
   - unique mapped hostname/subdomain (`user123.ide.example.com`),
   - dedicated persistent volume,
   - optional CPU/memory limits.
3. Gateway stops idle containers after inactivity timeout.
4. A reverse proxy (Traefik/Nginx/Caddy) routes each subdomain to the correct container.

### Minimum security checklist

- Do **not** expose raw Docker socket to public-facing apps.
- Use TLS certificates on your gateway/proxy.
- Run customer containers as non-root (already configured).
- Add network policies/firewall rules to isolate customer containers.
- Enforce per-user resource quotas.

## Kubernetes-friendly runtime command

Container entrypoint already starts Theia on port `3000`:

```bash
node /home/theia/theia-ide/src-gen/backend/main.js /home/theia/workspace --hostname=0.0.0.0 --port=3000
```

That makes this image straightforward to run in Kubernetes, ECS, Fly.io, Railway, or Nomad with a persistent volume per user.
