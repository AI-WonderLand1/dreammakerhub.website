# DreamMakerHub Deep-Dive Addendum — 2026-08-21

## Scope of this run

Follow-up trace from the 2026-08-20 stopping point. Priority was the actual AI execution path, build pipeline, route consolidation, mobile contract, monetization enforcement, and repository relationships. Only source-level evidence from the current `Master` branch was treated as verified.

## 1. AI execution path is more complete than the older pipeline bridge

### `engine/core/ai/runModel.ts`

- The engine has a real provider registry and dispatches models by provider prefix.
- Registered providers include Google, GitHub, Groq, OpenRouter, OpenCode, n8n, Cerebras, OpenAI, Anthropic, custom API, webhook, and DreamMakerHub.
- Unknown model prefixes fall back to OpenRouter.
- The DreamMakerHub provider is therefore not dead code: it is registered and reachable through `runModel()`.

### `engine/core/ai/providers/dreammakerhub.ts`

- The provider makes a real HTTP POST to `${baseUrl}/api/ai` and sends `messages`, `system`, `temperature`, and `provider: "dreammakerhub"`.
- It supports an optional bearer API key and parses several possible response shapes.

### `apps/web/app/api/ai/route.ts`

- A real `/api/ai` route exists and requires an authenticated Supabase user.
- It sanitizes the submitted `message` and calls the real `runModel()` provider system.
- **New interface mismatch:** the DreamMakerHub provider sends `{messages, system, temperature, provider}`, while `/api/ai` reads `const { message } = await req.json()`. As written, the provider's request does not supply the field the route requires and should return `400 Message is required` rather than reaching the model.
- This is a concrete provider-to-route contract defect, not a theoretical concern.

### `apps/web/app/api/ai/chat/route.ts`

- A separate, substantially richer `/api/ai/chat` route exists.
- It requires the shared paid-user gate, resolves a provider/model, loads user provider configuration, decrypts user provider keys when configured, runs the `runAIPipeline()` runtime, persists AI memory, and can store Mem0 memories/confessions.
- It is **not** the endpoint currently targeted by `dreammakerhubProvider`.

### `engine/core/ai/pipeline-v1/runtime/pipeline.ts`

- The runtime is real: it calls `runModel()`, emits process-step events, performs constitutional evaluation, extracts transparency confessions, and returns a final response plus structured confessions.
- Paid-mode confession extraction can make a second model call for LLM-based extraction.
- This means the core AI pipeline is materially more implemented than `engine/core/pipelines.ts`'s placeholder `getAIResponse()` path.

## 2. The public multi-agent builder is a genuine three-model-call pipeline

### `apps/web/app/api/build/stream/route.ts`

- The route accepts website, game, component, PlayCanvas, WonderSpace, 3D-assets and spatial build types.
- It calls `runModel()` three times in sequence: Architect → Builder → Reviewer.
- The Reviewer receives the generated code and returns a revised result.
- Optional save calls `manifestVisualBlock()` to persist a generated block.
- It streams stage events through SSE to the UI.
- **Commercial/security blocker:** the route does not require authentication before calling the AI pipeline. Anonymous callers therefore receive the free model path and can trigger multiple model calls per build.
- The route uses a boolean `isPaid` distinction, not the full plan/usage system. There is no visible per-build token/cost deduction in this route.

### `apps/web/lib/auth.ts`

- `getAuthUser()` derives `isPaid` solely from `data.user.app_metadata?.plan === 'pro'`.
- Current billing plan definitions include `free`, `pro`, `team`, and `enterprise`.
- **Entitlement mismatch:** a user whose authoritative plan is `team` or `enterprise` would not be considered paid by this helper unless another path writes `app_metadata.plan` as `pro`.
- `getAuthUser()` is client-oriented and calls `/api/auth/session`; the build route uses it server-side.

### `apps/web/app/api/auth/session/route.ts`

- Returns the Supabase session user and admin flag, but does not itself add an application plan field.
- Therefore the build route's `app_metadata.plan` value depends on external Supabase metadata synchronization not proven in this repository trace.

## 3. Unified AI routing exists, but some mapped downstream capabilities are uneven

### `apps/web/app/api/unified-ai/route.ts`

- Real authenticated unified endpoint with actions for chat, agent, runner and dashboard.
- Premium agent/runner actions are gated on `app_metadata.plan === 'pro'` or a smoke-user ID.
- Agent mappings route builder/designer/debugger to `/api/agent`.
- Runner `ai-worker` routes to `/api/ai/chat`.

### `apps/web/app/api/agent/route.ts`

- The builder/designer/debugger route is real.
- It validates commands against a whitelist, rejects dangerous code patterns, calls `runModel()` with an OpenRouter model, parses JSON output, scans generated code for dangerous patterns, and can persist a visual block.
- This is a concrete implementation of an AI agent endpoint, not just UI scaffolding.

## 4. Mobile backend mismatch remains confirmed

### `apps/mobile/lib/api.ts`

- Mobile `createBuild()` calls `${EXPO_PUBLIC_API_BASE_URL}/build` and expects JSON `{id,title,summary,status}`.
- With no API base URL, it intentionally returns a demo result after a 700ms delay.

### Current web build backend

- The verified production-like builder route is `/api/build/stream` and returns Server-Sent Events, not the mobile JSON contract.
- No matching `/build` JSON endpoint was found in the current repository search.
- **Conclusion:** mobile packaging is real, but the mobile builder is not connected to the verified web AI build contract.

## 5. Route consolidation has materially progressed

### `docs/route-consolidation-AUDIT.md`

- The repository now has a completed route-consolidation audit and records a canonical Build / Code / 3D structure.
- `/wonder-build/ai-builder` and `/wonder-build/preview` are intended to redirect to `/wonder-build/studio`.
- `/wonder-build/agent` is intended to remain live.
- `/ide` is the canonical cloud-code destination; `/coder-workspace` remains a richer landing page.
- The audit states that a central navigation registry was created and build verification was performed.

### `apps/web/lib/navigation.ts`

- The central navigation registry now exists.
- It explicitly defines Build → WonderBuild, Code → WonderSpace, and 3D → WonderPlay as the primary product structure.
- It also maps project types to canonical destinations.
- This corrects older report language that treated the missing navigation registry as an active blocker.

## 6. Latest commit context

The latest commit on `Master` at the time of this run is `2e9790a468239eab174cf6ccf5fbfe8c40438cfc` (`removed duplicates`, 2026-08-21 02:09 UTC). The repository is therefore actively changing, and older findings must be rechecked against current source before being treated as current blockers.

## 7. Current verified production blockers

### P0 — money / abuse / entitlement

1. Reconcile billing plan IDs, Supabase metadata, `profiles`/`user_profiles`/`subscriptions`, and actual feature enforcement.
2. Add usage/cost enforcement to `/api/build/stream` before accepting unrestricted public traffic.
3. Fix the `dreammakerhubProvider` → `/api/ai` request contract mismatch.
4. Ensure paid/team/enterprise plans are consistently recognized by build and unified-AI gates.
5. Connect mobile to a real JSON build endpoint or change mobile to consume the canonical SSE builder.

### P1 — execution correctness

6. Replace `engine/core/pipelines.ts` placeholder `getAIResponse()` with the existing provider/runtime path.
7. Implement real expression evaluation and dependency-output mapping in the generic graph executor.
8. Resolve the Coder workspace ID/readiness polling mismatch documented previously.
9. Consolidate duplicate/stale WonderSpace provisioning paths.

### P1 — security

10. Audit browser-local credentials in AI-PLAYGROUND/WonderSpace paths.
11. Keep service-role Supabase operations server-side.
12. Restrict permissive CORS and validate downstream provider-key handling.

## Next unresolved dependency to investigate

**Primary next trace:** billing/entitlement synchronization from Stripe webhook → Supabase/Auth metadata → `requirePaidAIUser`/`getAuthUser` → build/unified-AI access control → usage accounting. The goal is to prove, from source, whether a real paid subscription actually grants the intended capabilities and whether AI costs are bounded by the plan.

Secondary trace: Coder workspace creation response → stored workspace ID → readiness polling → returned IDE URL, including Supabase-user-to-Coder-user identity mapping.
