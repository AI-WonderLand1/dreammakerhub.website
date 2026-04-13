# Launch Troubleshooting (Verified in this repo)

## Verified working command
From repository root:

```bash
npm run dev
```

This runs root script:

- `npm run dev --workspace=ai-wonder-web`
- which then runs `node ./scripts/run-dev.mjs` in `apps/web`

## What was observed
- Dev server started successfully.
- Next reported local URL `http://localhost:5000`.

## Most likely launch blockers to check

### 1) Dependencies not installed at repo root
Run from root:

```bash
npm install
npm run dev
```

Do **not** install only inside `apps/web`; this project uses npm workspaces.

### 2) Wrong working directory / command
Use one of these exact commands:

```bash
# from repo root
npm run dev

# OR from apps/web
npm run dev
```

### 3) Port confusion
Default dev port is `5000`. If `5000` is taken, script auto-selects another open port and logs it.

### 4) Invalid PORT env var
If you set `PORT`, it must be an integer 1-65535.

### 5) Missing environment secrets (app may boot, but features fail)
For auth/data features, set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (optionally project-specific keys noted in docs)

## Quick verification commands

```bash
node -v
npm -v
npm run dev
```

If it still fails, capture and share:
1. Exact command you ran
2. Full terminal output from first error line onward
3. Current directory (`pwd`)
4. Whether `PORT` is set (`echo $PORT`)
