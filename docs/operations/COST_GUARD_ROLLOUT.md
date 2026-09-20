# DreamMakerHub cost guard rollout (NOT deployed)

This PR is a first stage of cost control, **not a guarantee of a dollar-denominated spending ceiling**. No database migrations, provider budgets, billing settings, or Kubernetes policies are applied by merging code alone. Keep billable services disabled until the entire deployment checklist is verified.

## Covered by this PR

- Authenticated `/api/ai`, `/api/agent`, and `/api/openrouter/chat` reserve conservative monthly units using a service-role-only Supabase RPC before contacting model providers. If quota accounting or subscription lookup fails, the request is denied. Reservations are not refunded on failure; usage counters reset on UTC calendar-month boundaries.
- `/api/openrouter/chat` permits only `OPENROUTER_ALLOWED_MODELS` (comma separated); the default is one `:free` model, limits input to 12,000 characters and output to 1,024 tokens. Do not allow expensive or `openrouter/auto` models without a priced per-model budget.
- Agent endpoint requires a Stripe-backed active/trialing Pro or Team subscription **and** an allowance. Its conservative request allowance is 100/month Pro or 500/month Team, in addition to the shared monthly AI token limit. These are temporary internal safety limits, not advertised plan benefits.
- New Coder workspaces require an authenticated paid subscription, a monthly launch allowance (Pro 1, Team 5), and `CODER_WORKSPACE_CREATION_ENABLED=true`. This is a monthly *start* quota, not an active-pod concurrency guard. The existing Coder template, TTL, persistent storage, and pod stop behavior must be verified separately.
- The builder `_projects` table receives a transactional insert trigger (Free 1, Pro 5, Team 10) to cover alternate DB insertion paths. This does not yet cover the legacy `projects` table or every external project store.
- Known unmetered AI POST endpoints are blocked by middleware until they each have a measured budget. This temporarily disables some builder and support-AI flows. Background workers, external API services, direct provider access, and newly added routes require a further audit.

## Prerequisites before ANY production enablement

1. Review this PR and get CI green. Validate the Supabase schemas and permissions on a nonproduction copy; review both migrations and apply them to the intended production project with an approved migration process. **Do not create a paid Supabase branch merely to test this without approving its cost.**
2. Validate verified subscription rows against real Stripe test/live webhooks, including canceled and failed-payment states. Never use an `x-plan` header, client profile field, or user-supplied plan for paid access.
3. Set provider-level hard account/project budgets or prepaid credit caps where supported, and disable auto-recharge; confirm OpenRouter/Groq/Gemini/Cerebras/other provider credentials cannot charge above your chosen budget. The app's estimated-token reservation is not a pricing engine and does not cap provider billing in dollars.
4. On Coder/Kubernetes: confirm per-pod CPU and memory ceilings, maximum pods/namespace, PVC and egress costs, guaranteed auto-stop/TTL behavior, cleanup of failed builds, and provider budget alerts. **Do not enable new customer pods solely because the website returns a successful request.**
5. Verify the exact running server has the correct `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and Stripe-backed entitlement data. The service-role key stays server-side only. Then set `BILLABLE_OPERATIONS_ENABLED=true` to activate guarded AI requests. Leave `CODER_WORKSPACE_CREATION_ENABLED` unset until step 4 is validated.
6. Confirm a free user cannot call paid agents or create a Coder pod, paid plan users stop at their quotas, two concurrent requests cannot exceed a limit, missing database RPC fails closed, all known unmetered routes return 503, and cancellation disables the next paid action.
7. Update subscription/usage displays from a *single* source of truth before marketing plan allowances. Existing pages disagree about free runtime and compute credits. Confirm which resources are truly delivered before making public promises.

## Emergency stop

Unset `BILLABLE_OPERATIONS_ENABLED` and `CODER_WORKSPACE_CREATION_ENABLED` and redeploy the website. That prevents **new** requests through the guarded routes. It does **not** stop existing pods, recurring infrastructure, workers, direct third-party API calls, or charges already incurred. Disable/limit provider API keys, stop/delete running billable workloads **only after checking data persistence**, and follow provider billing controls for the actual account.

## Known gaps requiring follow-up

There is no complete per-model dollar accounting, no strict project-wide cloud budget, no per-user cross-service one-minute rate limit, no active-Coder-workspace concurrency check, and no enforcement across every API, image/3D generation, external service, agent runner, asset storage or background job. The billing UI still uses a separate usage log and must not report the new reservation count as measured spend. Do not describe the entire platform as charge-proof or fully metered.
