# DreamMakerHub checkout verification

Status: source fixes proposed in PR #514; **not a claim of a working deployed payment system**. Track the remaining release checks in issue #513 and the broader entitlement reconciliation in #496.

## Expected customer flow

1. Pick Free on `/subscription` to initialize a Free profile without payment, or pick Pro/Team monthly/yearly to reach `/checkout?plan=...&interval=...`.
2. If signed out, the Checkout page sends the visitor through `/public-pages/auth` with the selected plan and interval preserved in `redirectTo`.
3. After explicit confirmation, the browser posts to `/api/subscription/subscribe` with the signed-in Supabase bearer token; the server validates the user and plan, creates a Stripe subscription Checkout Session, then redirects the browser to its HTTPS `session.url`.
4. Stripe returns to `/checkout/success?session_id=...` after checkout. `/api/subscription/checkout-status` checks the session against Stripe **and its signed-in owner**. The return URL alone cannot activate a subscription. Access should be provisioned by the signature-verified webhook and confirmed against the resulting database entitlement.
5. Cancellation returns to `/subscription?canceled=true`; no paid entitlement should be created.

## Required configuration in the actual running web process

Configure the following in the deployment's supported secret store / runtime environment. These are **variable names, not credentials**. Do not paste secret values into GitHub issues, screenshots, client code or a public `.env` file.

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server-only Stripe API key. Test-mode key in staging; live key only for approved production. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the **specific** active webhook endpoint; CLI test secret and Dashboard live secret differ. |
| `STRIPE_PRICE_PRO_ID` | Existing recurring **monthly Pro** Stripe Price ID. |
| `STRIPE_PRICE_PRO_YEARLY_ID` | Existing recurring **yearly Pro** Stripe Price ID. |
| `STRIPE_PRICE_TEAM_ID` | Existing recurring **monthly Team** Stripe Price ID. |
| `STRIPE_PRICE_TEAM_YEARLY_ID` | Existing recurring **yearly Team** Stripe Price ID. |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth project URL; `SUPABASE_URL` is also accepted server-side. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase key. The documented legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` works as a fallback. Never use a service-role/secret key in the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only credential used by the current Stripe webhook to synchronize plans. Its alternative `SUPABASE_SECRET_KEY` should be verified before switching. |
| `NEXT_PUBLIC_URL` | The customer-facing HTTPS origin used in Stripe success/cancel redirects. Set it to the actual deployed public origin, not a retired VM address. |

The application currently displays Pro at `$39/month` or `$390/year` and Team at `$129/month` or `$1,290/year` in `apps/web/lib/billing/plans.ts`. Compare the currency, recurring interval and amount of **each Stripe Price ID** with the intended product policy before enabling live payment. The billing feature descriptions/limits have known inconsistencies tracked in #496; code labels do not establish entitlements.

## Stripe Dashboard checks (read-only before test-mode checkout)

- Verify the account mode (test versus live), relevant active Prices and enabled payment methods. Stripe-hosted Checkout decides which payment methods to offer based on account, currency, country and configuration. A Plaid account connection by itself does not establish that Stripe bank debit is enabled.
- Confirm the active webhook endpoint URL is `https://dreammakerhub.website/api/webhooks/stripe` (or the actual chosen deployment origin), that its corresponding signing secret matches the runtime and that `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed` are delivered successfully. Review asynchronous payment events and handling before offering deferred payment methods.
- Confirm that a **test** Checkout reaches the expected origin, then inspect the signature-verified webhook delivery and the test user's `profiles.subscription_tier`, `subscriptions` status, and Auth `app_metadata.plan`. Check entitlement enforcement rather than relying on a green success page.
- Test canceled/failed payment, callback without an actual Stripe session, someone else's session ID, annual pricing, duplicate sessions, and retried webhook deliveries. Use Stripe test payment methods only. Do not charge a live payment or change live payment methods as part of a code review.

## Deployment gate

A merged PR or passing Next.js build is not evidence of an active Checkout deployment. Confirm the running image/commit and run the signed-in flow in a browser. Do not mark issue #513 complete until the active runtime config, Stripe session, webhook, database entitlements and production/test mode are all checked, with nonsecret evidence recorded in the issue.
