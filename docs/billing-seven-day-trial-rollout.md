# Replace permanent Free compute with a 7-day capped trial

Status: **implementation and test plan; not deployed**. Do not change Stripe
customers or production entitlements until the trial is implemented and verified.

## Verified live integrations on 2026-10-16

- Live Stripe account: AI-WONDERLAND INNOVATION. Four public paid product
  families (Creator, Architect, Studio, Guild) have active monthly/yearly
  prices corresponding to the public catalog ($19/$190, $39/$390,
  $79/$790, $129/$1290); older duplicate/legacy products and prices remain.
- Stripe live API returned **zero subscriptions** (first page, no more pages).
- Supabase `dreammakerhub.website` project: `hhdduixckgllodixrejp`
  status ACTIVE_HEALTHY. `public.profiles`: 9 rows;
  `public.subscriptions`: 0; `public.billable_usage_counters`: 0.
  These counts do NOT include all auth identities and must not be treated as
  the total number of website users.
- `public-plan-catalog.ts` advertises `$0/forever` and monthly AI and 3D
  allowances. `limits.ts` grants permanent free compute allowances.
- `subscription/page.tsx` still calls `/api/subscription/ensure` to
  activate a permanent Free plan; simply relabeling the CTA is **not**
  sufficient for a working trial.
- `cost-guard.server.ts` currently falls back to plan `free` when no
  Stripe subscription is verified. An AI / IDE authorization relying on this
  fallback must be revised; otherwise deleting pricing UI would not
  stop free compute.
- HostBrr production Compose currently disables BILLABLE_OPERATIONS_ENABLED,
  CODER_WORKSPACE_CREATION_ENABLED, CODER_CUSTOMER_PROVISIONING_ENABLED,
  FREE_BUILDER_AI_ENABLED. Do not turn these flags on during rollout.

## Product behavior

1. Users can sign up, sign in, browse templates, edit basic local or
   non-metered projects and retain access to their data without payment.
2. Offer exactly **one** seven-day trial per verified customer, with
   optional payment-method collection before allocating costly services.
   Use both a customer-level trial ledger and Stripe customer identity to
   prevent resets caused by signing up again. Do not trust client device,
   cookie, or client-declared tier to authorize a trial.
3. Trial limits must be explicit and bounded: AI credits and requests,
   3D/GPU jobs and duration, IDE minutes and concurrent workspaces,
   storage, and number of active jobs. Begin with zero-cost allowances for
   any capability lacking reliable accounting.
4. A trial starts only after an authenticated server-side state transition
   and is measured by server time. Expiry is enforced in API handlers,
   worker queues, IDE provisioning, and all connected services, not only
   in the UI.
5. At seven days or when limits are exhausted, block **new** chargeable
   activity and stop/clean up active billable resources. Preserve saved
   projects, files, and export paths.
6. **Never automatically convert a trial to paid.** On trial expiry show
   options to purchase Creator/Architect/Studio/Guild explicitly.
   Even if Stripe stores a card, no subscription should auto-renew because
   the trial was completed.
7. Keep existing account data and paid subscriptions intact. Notify old
   Free accounts before changing any existing entitlements.

## Implementation checklist

- [ ] Add database migration: append-only trial eligibility and consumption
      ledger, unique user trial grant, trial_started_at, trial_expires_at,
      trial status, reserved AI / 3D / IDE budgets and idempotency keys,
      RLS, indices and server-only transactional reservation RPC.
- [ ] Add authenticated `/api/trial/start`, `/api/trial/status`, including
      one-time eligibility verification and bounded allowances.
- [ ] Implement Stripe payment-method setup if needed, without creating an
      automatically billing subscription; verify setup session and webhook
      before starting the costly trial.
- [ ] Replace `/api/subscription/ensure` semantics for new customers:
      free registration is not a permanent compute entitlement.
- [ ] Update cost guard, all AI/3D/IDE server endpoints and cross-repo
      metering to recognize a verified active capped trial.
- [ ] Remove permanent Free **paid compute** grants from `limits.ts`;
      keep safe view/read/export permission for expired trial accounts.
- [ ] Update homepage, subscription, checkout, documentation and account
      dashboard. Label trial duration, exact included budget, card
      requirement and no-auto-charge policy clearly.
- [ ] Confirm live Stripe Product/Price IDs, checkout readiness and signed
      webhook processing; never create duplicate products without need.
- [ ] Test first trial, returning customer denial, concurrency/race,
      replayed requests, expiry, over-budget requests, interrupted IDE/3D
      jobs, existing Free accounts, explicit paid upgrade and cancellation.
- [ ] Deploy with the approved HostBrr GitHub workflow only after review.
      Keep the current public site unchanged until tests pass.

**Do not merge the trial change as an incomplete UI-only relabel.**
