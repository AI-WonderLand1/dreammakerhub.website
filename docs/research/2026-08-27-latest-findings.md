# DreamMakerHub Deep-Dive Findings — 2026-08-27

## Scope
Continued from the 2026-08-26 stopping point. Verified the current `Master` tree after the 2026-08-26 merge, then traced build, pipeline, billing, licensing, mobile, and Coder relationships from source rather than relying on README claims.

## Current repository state

The connected GitHub installation currently exposes `AI-WonderLand1/dreammakerhub.website` directly. The repository's current `Master` head is merge commit `d480925a29c1c9b13ed972acaae6e01275ac8c38` (2026-08-26). Separate `AI-PLAYGROUND` and `npc-ai-sim` repositories are not currently exposed through the connected GitHub repository list, so no new source-level claims are made about those repositories in this run.

## 1. Build pipeline: AI generation is real; persistence/runner is not

`apps/web/app/api/build/stream/route.ts` performs real multi-stage model calls through `runModel`: Architect -> Builder -> Reviewer, with an optional Runner stage. The request is validated with Zod and the endpoint streams SSE status events. The paid flag selects a paid model for Architect and Builder, but the Reviewer call omits the `isPaid` argument and therefore falls back to the free/default model path.

The most important new finding is the Runner persistence path. `route.ts` calls `manifestVisualBlock(safeName, finalCode, description)`, then reads `result.path`. The current `apps/web/core/ai/bridge.ts` implementation is only `export function manifestVisualBlock(_block: any) { return _block; }`. Because only the first argument is returned, `result` is the filename string and `result.path` is `undefined`. No file is written. The SSE event still reports `Saved to blocks/ ✓`.

Classification: **AI build generation = implemented; Runner persistence = scaffolding/false-success path.**

## 2. Pipeline-to-engine bridge is still non-production and has compile-level defects

The current `engine/core/ai/pipeline-v1/runtime/pipeline.ts` is a real AI runtime: it calls `runModel`, performs constitutional checks, extracts confessions, emits status events, and returns a structured result.

That should be distinguished from `engine/core/pipelines.ts`, which is a separate pipeline-to-engine bridge. It imports `GraphExecutor` and references `compilePipelineToGraph(...)`, but no definition/import for that function exists in the file. Its AI runner `getAIResponse(...)` explicitly returns a placeholder string, its `evaluateExpression(...)` returns the expression unchanged, and `encodePipelineConfig(...)` is only Base64 encoding rather than encryption.

`engine/core/execution/executor.ts` also calls `graph.getAllNodes()`, but the current `ExecutionGraph` interface in `engine/core/execution/types.ts` exposes `nodes: Record<string, ExecutionNode>` and no `getAllNodes()` method. `resolveInputs(...)` explicitly returns `node.inputs` and states that dependency-output mapping is not implemented.

Classification: **pipeline-v1 direct AI runtime = implemented; pipeline-to-engine graph bridge = incomplete/scaffolding and currently type/compile inconsistent.**

## 3. Billing path remains split

The dynamic checkout endpoint `apps/web/app/api/subscription/subscribe/route.ts` is real: it authenticates a Supabase bearer token, selects monthly/yearly Stripe Price IDs from `PLANS`, creates a Stripe Checkout Session, and places user/plan/interval in metadata.

The public `apps/web/app/checkout/page.tsx` does not call that endpoint. It contains a single hard-coded Stripe Payment Link and uses it for every paid plan. The UI displays the selected plan but does not pass the selected plan/interval to the server checkout path.

The Stripe webhook is correctly signature-verified and uses the Supabase service-role client, but its `checkout.session.completed` handler writes to `profiles.plan` and `subscriptions`. The migration `009_create_profiles_and_projects.sql` creates `user_profiles.subscription_plan` instead. `getAuthUser()` reads Auth `app_metadata.plan` and treats only `pro` as paid. No inspected code path proves that Stripe checkout updates Auth `app_metadata.plan`.

Classification: **Stripe transport exists; canonical entitlement is unresolved.**

## 4. Entitlement security remains a P0

The same migration gives authenticated users an UPDATE policy on their own entire `user_profiles` row. That row contains subscription plan, storage, project, compute, AI-token, runtime-hour and API-call limits/usage. No column-level protection is present in the migration. This means entitlement and quota fields are not clearly server-controlled at the database policy layer.

The build endpoint also calls `getAuthUser()` without passing the request. `getAuthUser()` performs a relative `fetch('/api/auth/session')` and catches all failures by returning null. Therefore a server-side failure in that relative fetch can silently turn a logged-in request into the anonymous/free path. This remains a runtime-verification item.

## 5. Sponsorship is published, but the payment path is not yet attached

The current README and `SPONSORSHIP.md` publish a Founding Sponsor program with Dreamer/Creator/Architect/Studio/Enterprise tiers and monthly/quarterly/annual pricing. The sponsorship document explicitly says the payment link and business contact are still “To be added.”

`.github/FUNDING.yml` points to the `wonderingtribe` Ko-fi account and the project website, but does not connect the published sponsor tiers to a dedicated payment flow.

Commercial classification: **sponsorship offer copy = implemented; sponsor checkout/collection = not yet wired.**

## 6. Licensing contradiction is still unresolved

`README.md` now presents proprietary/confidential commercial terms, while the root `LICENSE` still grants the MIT license, including rights to use, copy, modify, publish, distribute, sublicense, and sell the Software. This is a direct repository-level contradiction. The root license scope cannot safely be inferred from the README wording.

A history search also shows earlier license-file renaming activity in April, followed by the current root `LICENSE`; this history does not by itself resolve the intended scope. The project needs an explicit first-party/third-party licensing boundary before sponsors, customers, or licensees are promised proprietary rights.

## 7. Mobile configuration regressed into an internally inconsistent state

Commit `28cf239c84997097e82ff3e4084ee50d820c1851` changed `apps/mobile/package.json` to Expo `^53.0.27` with React Native `^0.72.17` and React `19.1.0`, while the same commit did not update the package-lock file. Expo's official SDK matrix states that Expo SDK 53 targets React Native 0.79 and React 19.0.0. Therefore the current mobile manifest is not aligned with Expo's supported SDK 53 dependency set.

The same commit also created a root `app.json` with EAS project ID `582a9688-3a54-4c9a-a4d4-2fc6fe365893`, while `apps/mobile/app.json` still uses EAS project ID `8f1bd6cb-c9b9-4a94-bd21-b30c47356ccd`. Both configs use the same Android package ID `com.dreammakerhub.website`. This is an unresolved EAS/project-identity conflict until the intended app/project mapping is proven.

## 8. Coder workspace identity bug remains confirmed

`apps/web/lib/coder/api-wrapper.ts` creates a local UUID before calling Coder, stores that UUID as the application's workspace ID, and then polls Coder using the local UUID. The Coder response is separately parsed using `coderWorkspace.id`. The code does not replace the locally generated ID with the actual Coder workspace ID before polling. This remains a P1 blocker for reliable WonderSpace provisioning.

## 9. Current build/deploy signal

The current merge commit has a successful repository status named `lucid-integrity - dreammakerhub.website` pointing at the Railway project. This is not equivalent to proving a complete production build or end-to-end commercial flow; it is only evidence that the reported integrity status is green.

## Updated implementation classification

### Implemented / substantially real
- OpenRouter transport and model fallback.
- Multi-stage AI build generation.
- Direct pipeline-v1 AI runtime.
- Stripe Checkout Session creation endpoint.
- Stripe webhook signature verification and persistence attempt.
- Coder API integration and workspace lifecycle scaffolding.
- WebContainer/Coder architecture.
- Sponsorship documentation and GitHub funding metadata.

### Scaffolding / incomplete / unsafe for commercial scale
- Build Runner persistence (`manifestVisualBlock` no-op).
- Pipeline-to-engine compiler and graph execution bridge.
- Canonical Stripe entitlement synchronization.
- User-controlled subscription/quota fields under current RLS.
- Server-side build authentication fallback behavior.
- Dedicated sponsor payment collection.
- Proprietary-vs-MIT license boundary.
- Current mobile Expo/RN dependency alignment and EAS project identity.
- Coder workspace ID mapping.

## Next unresolved dependency

The next research target is **the actual canonical entitlement and quota enforcement path**, followed by the mobile dependency/build state. Specifically: trace the plan record used by the dashboard, the plan record read by `getAuthUser`, the record updated by Stripe webhook, and the record consulted by feature gates/usage accounting; then determine whether any single source of truth exists in the deployed schema. After that, verify the mobile package-lock/EAS project relationship and locate the exact build API consumed by the mobile client.
