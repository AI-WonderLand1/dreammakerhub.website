# Docker Production Image Issues

## Problem: Entire `node_modules` Copied to Production

`apps/web/Dockerfile:58` — `COPY --from=builder /app/node_modules ./node_modules` copies the **full monorepo's** `node_modules` (including dev dependencies from `npm install --legacy-peer-deps`) into the production image.

### Impact
- **~100+ MB** unnecessary bloat (dev deps, all workspace deps)
- Vulnerable dev-only packages shipped to production
- Monorepo workspace packages (`@wonderspace/*`) are copied too, but production only needs runtime resolves

### Fix

**Option A — `npm ci --omit=dev` in a multi-stage install**

Add a third stage or filter in the build stage:

```dockerfile
FROM builder AS deps-filter
WORKDIR /app
RUN npm prune --omit=dev && \
    rm -rf packages/*/src packages/*/tsconfig.json
```

Then `COPY --from=deps-filter` instead.

**Option B — Standalone build via `@vercel/nft`**

Use `npx nft pack apps/web/.next/standalone` to trace only production-required files (requires `output: 'standalone'` in `next.config.mjs`).

**Option C — Minimal COPY per workspace**

Instead of `COPY --from=builder /app/node_modules`, individually list only the `node_modules` directories needed:

```dockerfile
COPY --from=builder /app/node_modules/.package-lock.json ./node_modules/
COPY --from=builder /app/node_modules/.pnpm ./node_modules/   # if pnpm
# Or explicitly copy each prod package needed
```

### Related Issues
- Line 20: `DATABASE_URL=dummy npm install` — all deps including dev installed
- Lines 62-71: Copied engine, infra, runners, ui, types — likely unused in production if `next build` already bundled them
- No `.dockerignore` for `node_modules`, `.git`, etc. (though Docker context may exclude them)
