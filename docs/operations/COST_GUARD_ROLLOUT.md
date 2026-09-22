# DreamMakerHub cost guard rollout (NOT fully deployed)

Code changes alone do not guarantee a dollar-denominated spending ceiling. No database migrations, provider budgets, billing settings, or Kubernetes policies are applied by merging GitHub code. Keep billable services disabled until deployment is verified.

## Covered by the application guards

- Authenticated `/api/ai`, `/api/agent`, and `/api/openrouter/chat` reserve conservative monthly units using a service-role-only Supabase RPC before contacting model providers. Missing accounting fails closed. Reservations are not refunded on failed requests; usage counters reset on UTC calendar-month boundaries.
- `/api/openrouter/chat` permits only `OPENROUTER_ALLOWED_MODELS`; default is a `:free` model with bounded input and output. An unpriced expensive model must not be added without an actual per-model budget.
- Agents require a verified Stripe-backed active/trialing Pro/Team subscription and reserve 100 requests/month Pro or 500/month Team, plus AI tokens. These are temporary internal safeguards, not advertised benefits.
- **Coder allocations:** see `docs/operations/CODER_POD_SAFEGUARDS.md`. New workspaces require paid verification plus a transactional allocation slot (one Pro, five Team). Stopping/restarting the same workspace does not consume a monthly launch. A stopped workspace still occupies its allocation and PVC. An allocation is released only after confirmed remote deletion. Both Coder templates need the new Terraform cost-guard version and a dedicated Kubernetes quota namespace to be published/applied by an operator.
- The builder `_projects` table has a transactional insert limit (Free 1, Pro 5, Team 10). The legacy `projects` table and external stores are not fully covered.
- Known unmetered AI POST endpoints remain temporarily blocked by middleware. Background workers, direct provider access, image/3D generation and newly added routes require separate review.

## Prerequisites before production enablement

1. Confirm CI and review pass. Validate the billable usage, project quota **and Coder slot** SQL migrations on a nonproduction database matching the actual Supabase schema; apply only after an approved production migration plan. Do not create a paid Supabase testing branch without approving its costs.
2. Check Stripe subscription records against real signed webhook events, cancellation and failed payment. Never trust a user-supplied plan or `x-plan` header.
3. Set actual provider-level spending limits or prepaid budgets where available, and disable unwanted auto-recharge. App token reservations do NOT limit provider invoices in dollars.
4. Carry out the separate `CODER_POD_SAFEGUARDS.md` checklist: correct active Coder origin (including HTTP 526), existing workspace inventory, published guarded templates, namespace ResourceQuota/LimitRange, verified TTL/auto-stop and cleanup, node/PVC budget. Do not enable customer pods based only on a UI success message.
5. Verify the deployed server has `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and real Stripe-backed entitlements. Keep service-role and Coder tokens server-side. Turn `BILLABLE_OPERATIONS_ENABLED` on only after the AI guards are tested, and leave `CODER_WORKSPACE_CREATION_ENABLED` unset until all Coder controls are verified.
6. Prove unauthorized/free users cannot use paid agents/pods; simultaneous calls cannot exceed quotas; unavailable DB fails closed; canceling a subscription blocks the next paid operation; Coder 202 deletion does not release a slot.
7. Reconcile the subscription UI with the actual enforced allowances before marketing them. Free runtime and compute-credit numbers have previously disagreed between pages.

## Emergency stop and known gaps

Unset `BILLABLE_OPERATIONS_ENABLED` and `CODER_WORKSPACE_CREATION_ENABLED` and redeploy: this prevents only NEW requests through guarded routes. It does not stop existing pods, paid nodes/PVCs, workers, direct provider calls, or charges already accrued. Stop workloads only after checking persistence, then use provider controls to limit infrastructure expenses. No complete per-model dollar accounting, cloud-wide hard spend cap, cross-service per-minute rate limit, or protection of every image/3D/background service exists yet. Usage-dashboard logs are not the same as prepaid reservations or measured dollars.
