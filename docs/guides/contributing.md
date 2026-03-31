# Contributing Guide

Thank you for helping build AI-WONDERLAND! This project targets multiple runtimes (browser, Node, edge), so contributions should stay portable whenever possible.

## Getting set up
- Install dependencies with `pnpm install`.
- Copy `.env.example` to `.env.local` (or create it) and fill in required keys (Supabase, Stripe, etc.). Keep secrets out of git.
- Start the dev server with `pnpm dev`.

## Branching & commits
- Branch naming: `feature/<short-summary>` or `fix/<short-summary>`.
- Use clear, imperative commit messages (e.g., "Add deployment checklist").
- Keep changes scoped; prefer multiple small PRs over a single large one.

## Code style
- Follow existing patterns: server components by default, client components only when required.
- Avoid React/Next imports inside `core/**`; keep framework-agnostic logic there.
- Prefer utilities in `lib/` for shared helpers instead of duplicating logic.
- Do not wrap imports in `try/catch` blocks.

## Testing & verification
- Run `pnpm test` before pushing.
- Run `pnpm build` before pushing to catch type and bundling issues.
- Add or update tests in `tests/` for new features or bug fixes.
- For API changes, update `openapi.yaml` and include a contract test where possible.

## Docs workflow
- Edit root docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`) as the source of truth.
- Run `scripts/sync-guides.sh` to mirror root docs into `docs/guides/*` for the docs site.
- If you add new sections, also link them from `README.md` or relevant feature docs.

## Pull requests
- Describe the change, motivation, and testing performed.
- Call out breaking changes or new environment variables explicitly.
- Keep UI changes accompanied by screenshots when applicable.
