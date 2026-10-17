# Trial-only entry access

Public memberships are Creator, Architect, Studio, Guild and Enterprise. There is no permanent free membership. The internal `free` identifier remains compatible with old records but grants zero included usage. A trial is a distinct entitlement, activated by the signed-in customer on the subscription page.

The trial lasts 14 days from its first explicit activation. No card or Stripe checkout is involved, and it never converts or charges automatically. It includes 500K AI credits, 10 3D credits, 5 projects and 5 GB of builder-file storage. AI/3D/request caps cover the whole trial, including across calendar months. Existing provisioning and provider safety switches still apply.

## Deployment order

1. Apply `supabase/migrations/202610170001_one_time_account_trial.sql` followed by `supabase/migrations/202610170002_sync_trial_billing_memberships.sql` through the normal database migration workflow before deploying the application changes. It depends on the existing subscriptions, builder storage and cross-repo usage migrations. Back up the database through the normal deployment process.
2. Deploy the application. Verify authenticated trial activation, repeat activation returning the same expiry, usage, project creation, expiry denial, and a verified paid subscription in a staging Supabase project.
3. Keep provider credentials, Stripe keys and Supabase server credentials in secure environment settings. Do not enable billable/provisioning switches until their existing prerequisites pass.

The migration does not enroll existing free customers automatically, delete their projects, change Stripe subscriptions, or charge customers. Existing free customers must explicitly start their one-time trial or purchase a membership. After expiry, existing builder projects remain readable and deletable; new project/file/revision writes require an active trial or verified paid membership. Trial storage is enforced over canonical builder-file content. The legacy usage-profile table, when present, loses its permanent free defaults.

## Validation

`npm test` includes behavioral trial enrollment and entitlement tests. `npm run typecheck:regression` checks the recorded TypeScript backlog for new diagnostics. `npm run build --workspace=apps/web` is the web-only production build; this repository's CI uses scoped build placeholders for the unrelated ALICE/SIMPLE_RICK/SPIRIT_GUIDE integrations and local MongoDB/PostgreSQL URLs.

The migration was additionally exercised against an isolated PostgreSQL-compatible PGlite instance with the real existing atomic usage-reservation function: applying twice, enrollment idempotency, 14-day duration, monthly-boundary caps, inflated-limit rejection, project limits, expiry, retained read/delete access, paid access, cancellation and privilege restrictions. No live Supabase project was available during setup; the migration has not been applied to a live database.

To rerun the isolated database checks without changing repository dependencies:

```bash
npm install --prefix /tmp/dreammakerhub-sql-validation --no-audit --no-fund @electric-sql/pglite@0.5.10
node scripts/billing/check-account-trial-migration.mjs /tmp/dreammakerhub-sql-validation/node_modules/@electric-sql/pglite/dist/index.js
```

This creates an in-memory test database with minimal prerequisite tables and the real existing reservation function. It does not connect to Supabase.

## Stripe and Supabase synchronization

Target Supabase project: `hhdduixckgllodixrejp`. Stripe target: **live mode**, as requested. No live services have been changed during local validation.

The second migration allows multiple historical subscription rows for a reused Stripe customer, replaces the older one-project quota function, synchronizes Supabase profiles and trusted auth metadata on trial/subscription changes, and exposes current membership through an authenticated, owner-scoped RPC. The session API resolves expiry dynamically; JWT/profile copies alone never establish current access. Existing free identifiers mean inactive accounts, with zero allowance.

Stripe remains paid-only: the no-card trial exists only in Supabase. Paid checkout reuses the account's Stripe customer, requires a payment method, and does not request a Stripe trial period. Subscription webhooks retrieve current Stripe state before processing update events, preserve other active memberships, and reconcile remaining trial access without extending it. Failed invoice handling targets only the affected subscription.

Live migration application requires a Supabase management access token for `api.supabase.com` (or the normal trusted migration pipeline). The service-role key is used for application RPCs and cannot apply SQL migrations. Stripe catalog verification requires a live Stripe key for `api.stripe.com`. Add those values securely in environment settings; do not put them in this document or chat. Keep the existing deployed `STRIPE_WEBHOOK_SECRET` set to the signing secret for the live `/api/webhooks/stripe` endpoint. Proxy credential placeholders cannot be used as local webhook signing secrets.
