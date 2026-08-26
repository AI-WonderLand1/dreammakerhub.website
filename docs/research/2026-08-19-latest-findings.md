# DreamMakerHub Deep-Dive Addendum — 2026-08-19

## Billing limits follow-up

`apps/web/lib/billing/limits.ts` confirms that plan entitlements are represented in code for free/pro/team/enterprise, including storage, projects, workspaces, IDE sessions, compute credits, AI tokens, runtime hours, API calls, and feature permissions.

However, this file also exposes a production-readiness issue: `UserLimits` does not define `projectsUsed`, while `checkProjectLimit()` reads `limits.projectsUsed`. That is a TypeScript/type-consistency defect unless the type is extended elsewhere through an unsupported augmentation. The helper also uses the browser Supabase client for reading/updating usage counters, so server-side enforcement and RLS must be verified before these limits are treated as authoritative.

`checkAndConsumeAITokens()` reads current usage, logs usage, then updates the user profile. This is a check-then-update sequence rather than an atomic decrement/transaction, so concurrent requests could oversubscribe the monthly token allowance unless database-level constraints or server-side serialization exist elsewhere.

## Agent API follow-up

`agent/api/main.py` exposes a real FastAPI agent service and `agent/core/alice.py` makes genuine Gemini calls. The service is therefore a real backend component, not merely a UI mock.

The security defects remain high priority: wildcard CORS with credentials, unauthenticated `/api/keys/create`, a default production pepper of `change-me-in-production`, and hash-algorithm inconsistency between key creation and revocation/usage logging in `agent/core/api_keys.py`.

## Coder follow-up

The public `WonderSpaceIDE` and `PodLauncher` components are confirmed to call the real authenticated `/api/user-workspace/provision` endpoint. The strongest remaining blocker is in `CoderAPIWrapper.createWorkspace()`: a local random UUID is generated and later used for readiness polling instead of the Coder-returned workspace ID. The Coder/Supabase user identity mapping also remains unverified.

## Commercial follow-up

The repository has both a real dynamic Stripe Checkout Session route and a separate public UI that hard-codes a single Stripe Payment Link. The dynamic route should become the authoritative purchase path before live subscriptions are accepted. Plan-specific Price IDs and monthly/yearly selection should be tested end-to-end.
