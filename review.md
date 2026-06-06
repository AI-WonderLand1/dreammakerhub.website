# Repository Review: dreammakerhub.website (ai-wonderland)

> Review generated on 2026-06-06 against commit `cfe9531`

---

## 🔴 Critical Issues

| # | Issue | Location |
|---|-------|----------|
| 1 | **Committed private keys** — OCI private key (`mobile_oci_key.pem`) and public key are tracked in git. Rotate immediately and purge from history. | `mobile_oci_key.pem`, `mobile_oci_key_public.pem` |
| 2 | **Undefined variable → runtime crash** — `OPENCODE_API_KEY` is referenced without `process.env.`, will throw `ReferenceError`. | `apps/web/app/api/ai/image/route.ts:14` |
| 3 | **Broken internal package** — `package.json` declares `./src/index.ts` as main/export but file lives at `./index.ts` (no `src/` dir). Referenced components don't exist. Not wired into workspaces. | `apps/web/packages/ui/` |
| 4 | **No tests exist** — `npm test`, `vitest run`, and `scripts/release-gates-check.sh` all exit with "No test files found". CI and release gates are non-functional. | entire repo |

---

## 🔶 High-Impact Issues

| # | Issue | Location |
|---|-------|----------|
| 5 | **No root `tsconfig.json`** — Only `tsconfig.base.json` exists. `ts-prune`, IDE integrations, and `tsc --noEmit` fail without it. | repo root |
| 6 | **Stale AGENTS.md** — Documents 5 packages that don't exist on disk (`playcanvas-ext`, `puck-editor`, `ui-kit`, `engine-core`, `shared-types`). | `AGENTS.md` |
| 7 | **Broken tsconfig paths** — `@puckeditor/core` resolves to non-existent `packages/puckeditor-core/`. | `tsconfig.base.json`, `registry.json` |
| 8 | **Cross-workspace coupling** — `engine/core/` imports from `apps/web/lib/env` via tsconfig aliases, preventing independent use. | `engine/core/alice-proxy.ts`, `engine/core/ai/providers/opencode.ts` |
| 9 | **ESLint config mismatch** — Script uses deprecated `--ext` flag. Config doesn't use `eslint-config-next` despite being installed. No prettier config despite docs. | `package.json` lint script, `eslint.config.js` |
| 10 | **Lint fails entirely** — `Cannot find module 'typescript'`. | `npm run lint` |

---

## 🟡 Medium Issues

| # | Issue | Location |
|---|-------|----------|
| 11 | **`require()` in ESM context** — Root `package.json` has `"type": "module"` but many files use `require()` directly (k8s, jsdom, three.js, jszip, child_process). | Multiple files across `apps/web/lib/` and `apps/web/app/` |
| 12 | **`moduleResolution: "node"`** — Outdated for TypeScript 6. Should be `"bundler"` or `"nodenext"`. | `tsconfig.base.json`, `apps/web/tsconfig.json` |
| 13 | **Duplicate file ambiguity** — 4 files exist as both originals in `engine/core/` and re-exports in `engine/core/ai/`. Canonical import path is unclear. | `alice-proxy.ts`, `filter-guard.ts`, `local-memory.ts`, `syncGuard.ts` |
| 14 | **Duplicate `runModel.ts`** — Two different implementations: multi-provider (canonical) and Google-only legacy. | `engine/core/ai/runModel.ts` vs `engine/core/ai/pipeline-v1/runModel.ts` |
| 15 | **Duplicate `package.json`** — Identical content; one is dead. | `wonderplay/package.json` vs `apps/web/public/Wonder-build/package.json` |
| 16 | **Committed Vim swap file** — `*.swp` in `.gitignore` doesn't match dotfiles. | `apps/web/.tsconfig.json.swp` |
| 17 | **Tailwind v3 config format on v4** — Uses v3 `Config` type but project has Tailwind v4 (CSS-based config). | `apps/web/tailwind.config.ts` |
| 18 | **Version mismatches** — `react`, `react-dom`, `eslint`, `prisma` versions differ between root and `apps/web`. | Root vs `apps/web/package.json` |

---

## 🟢 Low / Cleanup Issues

| # | Issue | Location |
|---|-------|----------|
| 19 | **Dead root `hooks/` directory** — Single placeholder file kept to "prevent parser failures". | `hooks/useAIEventStream.ts` |
| 20 | **Unused dependencies** — `eslint-config-next`, `js-cookie`, `node-fetch`, `@eslint/eslintrc` installed but never imported. | Root `package.json` |
| 21 | **Duplicate `Wonder-build/`** — Template file at root vs actual app in `apps/web/`. | `Wonder-build/puckAiBlueprint.ts` |
| 22 | **API key in URL query string** — Passed as `?key=${apiKey}`; URLs get logged by proxies/load balancers. | `engine/core/ai/providers/google.ts:11` |
| 23 | **Dead code package** — `packages/shadon/` re-exports non-existent components. | `packages/shadon/` |
| 24 | **PostCSS CJS in ESM project** — `module.exports` while root is `"type": "module"`. | `apps/web/postcss.config.js` |
| 25 | **No `.prettierrc`** — Mentioned in AGENTS.md but doesn't exist. | repo root |

---

## 📋 Recommendations

### Immediate (security + runtime safety)
1. Rotate OCI keys, purge from git history (`git filter-repo` or bfg), and add `*.pem` to `.gitignore`
2. Fix `apps/web/app/api/ai/image/route.ts:14` — prefix with `process.env.`
3. Remove or properly wire `apps/web/packages/ui/`
4. Write at least one test to unblock CI and release gates

### Short-term
5. Create root `tsconfig.json` extending `tsconfig.base.json`
6. Fix `npm run lint` — add `typescript` to root `devDependencies`
7. Update AGENTS.md to reflect actual directory structure
8. Remove `.tsconfig.json.swp` and fix `.gitignore` to match dotfiles
9. Remove `mobile_oci_key*.pem` from git tracking
10. Decide canonical import paths for the 4 duplicated `engine/core/` files

### Medium-term
11. Migrate CJS `require()` calls to ESM `import` where possible
12. Update `moduleResolution` to `"bundler"` across all tsconfigs
13. Remove unused dependencies
14. Remove dead code (`hooks/`, root `Wonder-build/`, `wonderplay/`, `packages/shadon/`)
15. Unify dependency versions across root and `apps/web`

### Cleanup
16. Remove or properly implement `packages/shadon/`
17. Remove duplicate `Wonder-build` file
18. Add `.prettierrc` or remove from AGENTS.md

---

## Git Health

| Metric | Status |
|--------|--------|
| Working tree | Clean |
| Branch | `Master` (single branch) |
| Stashes | None |
| Recent activity | Mostly Dependabot dependency bumps |
| Remote branches | `origin/Master`, `origin/master` (duplicate casing), a few feature/autofix branches |
| Uncommitted changes | None |

---

## Build Status

| Command | Result |
|---------|--------|
| `npm run lint` | ❌ Fails — `Cannot find module 'typescript'` |
| `npm test` | ❌ Fails — No test files found |
| `scripts/release-gates-check.sh` | ❌ Fails — No test files found |
| `npx ts-prune` | ❌ Fails — No root `tsconfig.json` |
| `npm run build` | ⚠️ Not verified (dependent on above fixes) |
