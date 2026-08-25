# DreamMakerHub Deep-Dive Addendum — 2026-08-25

## Scope

Fresh source trace across the currently accessible `Master`/`main` branches of `dreammakerhub.website`, `AI-PLAYGROUND`, `wonderplay-3D`, `vanguard-engine`, and `MOBILEAPP-VANGUARD-ENGINE`.

## 1. dreammakerhub.website — current head and AI execution

The repository has not advanced past `4f03c21` since the 2026-08-24 research snapshot. The current code still contains a real OpenRouter transport in `apps/web/core/ai/runModel.ts` with selected-status fallback to `meta-llama/llama-3.3-70b-instruct:free`.

The `/api/build/stream` path is a genuine four-stage build flow: Architect -> Builder -> Reviewer -> optional Runner. The route accepts anonymous requests; it calls the model three times for a normal build, and the Reviewer call does not pass the `isPaid` flag, so that stage uses the free/default model path. The route does not visibly enforce a per-build quota/rate limit or usage deduction before making the calls. This remains a direct cost-abuse risk if exposed publicly.

`getAuthUser()` derives `isPaid` solely from `session.user.app_metadata.plan === 'pro'`. The session route returns the Supabase user but does not itself assign the plan. No current source trace in this pass proved that Stripe completion updates Auth `app_metadata`; the verified webhook instead writes a `profiles.plan` field and a `subscriptions` row.

### Additional auth-path concern

`getAuthUser()` in `apps/web/lib/auth.ts` performs `fetch('/api/auth/session')` and is imported directly by the server-side `/api/build/stream` route. In a Node/Next server execution context, a relative URL passed to the standard `fetch()` API normally requires an absolute origin; the code catches any failure and returns `null`. Therefore this path should be runtime-tested because a relative-URL failure would silently classify the caller as anonymous/free even when a valid session exists. This is recorded as a **runtime-verification item**, not a confirmed production failure, until an actual deployed trace or build test proves the behavior.

## 2. Billing chain — a more precise failure map

A dynamic Stripe checkout API exists at `/api/subscription/subscribe`. It authenticates a bearer token, validates the requested plan/interval, selects the configured monthly/yearly Stripe Price ID, and creates a real Stripe Checkout Session with `userId`, `plan`, and `interval` metadata.

However, the public `/subscription` page bypasses that dynamic route for paid plans: its plan objects use one hard-coded Stripe Payment Link as `href`, and `onSelect()` navigates directly to that link. The `/checkout` page also contains the same hard-coded Payment Link rather than invoking `/api/subscription/subscribe`. This means the live UI does not prove that the selected plan or annual interval reaches the dynamic checkout endpoint.

The billing toggle has a state bug: `billingInterval` uses `"month" | "year"`, but the toggle handler checks for `"monthly"`. The condition should be normalized to a direct `billingInterval === 'year'` test.

The free-plan `/api/subscription/ensure` route writes to a `profiles` table with `{ id, plan: 'free' }`. The inspected `009_create_profiles_and_projects.sql` migration instead creates `user_profiles` with `subscription_plan` and usage-limit columns; it does not create the `profiles.plan` schema assumed by `ensure`.

The Stripe webhook route also writes paid state to `profiles.plan` and `subscriptions.plan/interval`. Therefore there are at least three competing representations in the codebase: `user_profiles.subscription_plan`, `profiles.plan`, and `subscriptions`. The feature gate in `getAuthUser()` reads a fourth representation: Supabase Auth `app_metadata.plan`. The end-to-end entitlement path is still unproven and likely inconsistent until these are consolidated.

## 3. Unified AI regression discovered

`apps/web/app/api/unified-ai/route.ts` maps the `spirit-guide` agent to `/api/chat`, reflecting the newer Alice-based path. But its default `handleChatRequest()` still fetches `/api/spirit-guide/chat`.

A 2026-08-23 cleanup commit explicitly deleted the old `/api/spirit-guide/chat` route and remapped the Spirit Guide agent to `/api/chat`. The remaining default `handleChatRequest()` reference is therefore stale and can produce a 404/503 path for default unified-chat actions. This is a concrete post-cleanup routing regression.

## 4. Coder/Kubernetes — the previously suspected ID problem is still present

`apps/web/lib/coder/api-wrapper.ts` generates a local UUID before calling Coder's `POST /api/v2/users/{userId}/workspaces`. It stores that locally generated UUID as the persisted workspace `id`, then calls `waitForWorkspaceReady(workspaceId, userId, 60000)` using the local UUID. `getWorkspace()` calls Coder with that ID.

The same file's `parseWorkspaceResponse()` correctly uses `coderWorkspace.id` when parsing a real Coder response. This creates a concrete identity mismatch: the create path polls Coder using a locally generated ID instead of the Coder workspace ID returned by the POST response. The earlier P1 blocker remains valid.

## 5. AI-PLAYGROUND — current main is directly verifiable

`AI-PLAYGROUND` is currently accessible on `main`; the latest commits remain the 2026-08-21 workflow/library cleanup sequence.

`server/index.ts` has real CORS allowlisting, rate limits for template/chat/stream routes, Wonderland-key validation, real provider calls, and a correctly mounted Stripe webhook route using raw JSON for signature verification.

`server/stripe-webhook.ts` is a real Stripe webhook handler. It verifies signatures, retrieves subscriptions on checkout completion, upserts `subscriptions`, and handles subscription updates/deletion/payment success. However, this repo's SQL schema only defines the `subscriptions` table as a data store; the current server entrypoint does not expose a checkout-session creation route. In other words, AI-PLAYGROUND has a webhook consumer but no verified standalone customer checkout flow in the inspected server surface. The commercial checkout source of truth remains the DreamMakerHub web app unless a separate frontend integration is proven.

`server/providers/registry.ts` confirms that OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI, and Google Gemini have real request builders/parsers. Replicate and Hugging Face remain explicit stubs: their request builders return `{}` and their parsers return `Empty response received.`.

A new security concern was re-confirmed in `src/components/ApiKeysView.tsx`: the client stores API-key records in `localStorage` and generates token-shaped strings locally with `Math.random()`. The source also contains several hard-coded `sk-or-v1-...`-shaped sample values. Their live validity cannot be proven from source alone, so they are classified as potentially sensitive-looking test fixtures rather than confirmed live credentials. If any are real, they should be revoked/rotated immediately.

## 6. wonderplay-3D — live NPC remains a split implementation

Current `main` remains `aaf1f7b` from 2026-08-22. `package.json` declares `@types/ws` as a dev dependency but does not declare the `ws` runtime package. `server.ts` dynamically imports `ws` and creates a `WebSocketServer({ noServer: true })` for `/live-npc` behavior.

The server contains real Gemini-backed NPC intelligence, image vision, and video analysis endpoints. It also contains a WebSocket connection handler. But the WebSocket behavior still explicitly simulates NPC thinking and sends randomized viseme values at 100 ms intervals. A complete HTTP-server upgrade wiring and a provider-backed live dialogue loop are not proven by the current source trace.

The server's subscription endpoints remain an in-memory object keyed by email. They are not Stripe-backed or durable and should be treated as demo scaffolding, not the commercial subscription system.

## 7. Vanguard lineage relationship

Both `vanguard-engine` and `MOBILEAPP-VANGUARD-ENGINE` contain essentially the same Vanguard architecture/README narrative: C++20/23, Actor/Component/SceneGraph, reflection, Vulkan 1.3 render graph, Jolt Physics, Dear ImGui, Tracy, and a Next.js Engine Architect Studio. The older `vanguard-engine` has eight commits establishing the complete source tree; the mobile repository exposes the same architecture and README text.

This is strong evidence of a shared/duplicated engine lineage, but it is not enough to claim one repository is a clean fork of the other. No explicit migration manifest or cross-repository import relationship was found in this pass. Treat them as parallel Vanguard lineages until commit/tree ancestry is proven.

## 8. Commercial readiness impact

The strongest genuinely commercial pieces today are:

- real server-side OpenRouter model transport;
- authenticated premium chat;
- usage/realtime infrastructure;
- a real multi-stage AI builder;
- real Coder/Kubernetes workspace infrastructure;
- browser-local WebContainer IDE infrastructure;
- engine adapters and Spatial/Gaussian-splat integration;
- real Gemini NPC analysis endpoints;
- real Expo/EAS mobile packaging;
- a native C++/Vulkan engine lineage.

The highest-risk commercial gaps remain billing entitlement consistency, anonymous AI build cost exposure, possible silent auth fallback in the server-side build path, stale unified-chat routing, Coder workspace identity mismatch, simulated WonderPlay live-NPC behavior, mobile API parity, and repository/IP separation across the engine lineages.

## Next unresolved dependency chain

1. Prove which database schema actually exists for `profiles`, `user_profiles`, and `subscriptions` and reconcile it with the Stripe webhook.
2. Trace whether any code updates Supabase Auth `app_metadata.plan` after successful payment.
3. Trace the selected Stripe Price ID from the UI through checkout metadata to the webhook and final entitlement.
4. Runtime-test the server-side `getAuthUser()` relative-fetch path and replace it with direct server auth if necessary.
5. Trace `/api/build/stream` usage logging and quota enforcement, if any, beyond the inspected route.
6. Trace the WonderPlay WebSocket upgrade path and whether the `ws` runtime dependency is supplied indirectly by the Bun lockfile/build image.
7. Compare Vanguard repository trees/ancestry to determine whether `vanguard-engine` and `MOBILEAPP-VANGUARD-ENGINE` are forked copies, generated copies, or independent reimplementations.
