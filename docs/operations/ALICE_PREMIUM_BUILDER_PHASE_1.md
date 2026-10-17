# Alice premium image capabilities — review checklist

**Status:** Draft PR, not released or deployed. No automated trial enrollments or paid charges.

## Scope
- Alice in the existing WonderBuild visual editor accepts a PNG/JPEG/WebP screenshot of up to 4 MiB.
- The server calls a configured Gemini vision model to produce a design description; Alice's existing /api/ai action flow uses this as untrusted visual reference to apply/edit safe, existing builder blocks.
- The existing text-to-image endpoint is permitted by middleware only with BILLABLE_OPERATIONS_ENABLED=true and now reserves credits **before** reaching any image provider.
- Both paths require the existing authenticated account, an active server-verified one-time 14-day trial or Stripe-verified paid plan, and the Supabase reservation RPC.
- When billing is disabled or unavailable, paid generation stays paused. Other blocked /api/ai/* endpoints remain blocked.
- AI image generation currently uses the existing fixed `TI_COSTS.generate_image` rate (200 credits) plus one API request. Provider costs vary: **verify that this reservation is sufficient for each available image model** before activating production billing. Vision calls use the existing premium model multiplier and output budget.
- No changes to customer tables, trial start policy, Stripe subscriptions, provider secrets, paid plans, or production runtime.

## Required before enabling in production
1. Apply/verify `202610170001_one_time_account_trial.sql` and `202610170002_sync_trial_billing_memberships.sql` on the real Supabase project. Never assume the migrations have run just because they are in GitHub.
2. Verify the existing `reserve_billable_units_v2` RPC and Stripe entitlement lookup are installed, and run negative tests for missing/expired/over-limit trial accounts.
3. Configure GEMINI_API_KEY or GOOGLE_AI_API_KEY **only on the server** for screenshot understanding; separately configure an actual provider for images.
4. Audit image provider pricing, image metadata retention, quotas, and refund/reconciliation behavior for failed provider calls. Existing paid reservations do not auto-refund.
5. Use a private environment to test a screenshot-to-edit prompt, a text-to-image prompt, and a false-provider test. Confirm all screenshots and generated pages are reviewed before publishing.
6. Run Vitest, TypeScript checks and a production build. Protect the main website, NPC and Playground; deploy only after approval.

## Not in this PR
- A full multi-file React/Next.js backend and secure build runner, executable preview for generated API servers, project-level authenticated deployment, image-to-component pixel reconstruction, or automatic training of Alice.
- The old Alice.01 Hugging Face Gradio Space has not been modified; this is DreamMakerHub application routing using separately configured providers.
- A true owner-scoped upload storage pipeline: uploaded screenshots are sent in the request directly to Gemini and are not explicitly persisted by this implementation.

## Manual acceptance tests
- Missing login -> HTTP 401 and no provider invocation.
- Invalid, corrupt, unsupported or over-4MiB reference -> 400/413, no debit.
- No configured provider -> 503, no debit.
- Missing/expired/exhausted trial and billing off -> cost guard, no provider invocation.
- Valid active trial -> one reserved premium vision request, description displayed as editable builder actions (if the existing builder provider returns valid actions).
- Text-to-image -> account credits reserved prior to any provider network call.
- Failed model response -> explicit error; the editor does not fabricate edits or successful publishing.
