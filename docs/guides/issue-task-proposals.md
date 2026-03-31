# Codebase Issue Task Proposals

## 1) Typo task
**Task:** Fix the path typo in the generated directory doc where the top-level app path is documented as `app` instead of `apps/web/app`.

**Why this matters:** New contributors can navigate to the wrong location and assume the repo layout is broken.

**Acceptance criteria:**
- Update the generation source or generation script so the path is emitted as `apps/web/app`.
- Regenerate `docs/tree-directories.md` and verify path consistency against real folders.

## 2) Bug fix task
**Task:** Harden `GET /api/collaboration` to validate `projectId` and handle Supabase errors.

**Why this matters:** The handler currently returns `200` even if `projectId` is missing or the query fails, which can hide production failures and return misleading empty data.

**Acceptance criteria:**
- Return `400` when `projectId` is absent.
- Return `500` with a safe error payload when Supabase query fails.
- Keep `200` only for successful reads.

## 3) Comment/docs discrepancy task
**Task:** Reconcile docs workflow instructions in `docs/guides/contributing.md` with the actual repository files.

**Why this matters:** The guide instructs updates to root docs (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`), but those files are not present in repo root, causing contributor confusion.

**Acceptance criteria:**
- Either add the documented root files, or update the guide to point to the true source docs.
- Ensure the sync step (`scripts/sync-guides.sh`) references valid source file paths.

## 4) Test improvement task
**Task:** Improve test isolation and coverage in `tests/wonder-build.test.ts`.

**Why this matters:** Tests override `global.fetch` repeatedly but do not restore the original fetch implementation, which can leak state across tests and create flakiness.

**Acceptance criteria:**
- Capture original `global.fetch` and restore it in `afterEach`.
- Add at least one API handler test for unauthorized requests (expect `401`).
- Add one failure-path test for collaboration or subscription route error handling.
