# AI WONDERLAND — Production & Revenue To-Do List

> **Purpose:** Make DreamMakerHub.website usable, protect infrastructure spending, replace the permanent free *compute* tier with a capped trial, and reach the first paying customers.
>
> **Status:** Planning checklist. An unchecked item means **not verified complete in production**, not necessarily that no code exists.
>
> **Release policy:** No billing changes, production migration, or customer-facing paid compute until tested and explicitly approved.

## P0 — Stop losing money

- [ ] Inventory all cost-generating AI, image, 3D, background worker, GPU, API, and Coder endpoints.
- [ ] Disable unrestricted free AI, GPU, 3D, and IDE access **on the backend**, not just in pricing/UI.
- [ ] Replace the permanent Free compute plan with free registration, template browsing, and basic non-metered editing.
- [ ] Design a **7-day, capped, once-per-customer trial** requiring a payment method before costly features.
- [ ] Require an **explicit purchase to become paid**; never unexpectedly charge at trial end.
- [ ] Enforce trial expiry and AI token/request, GPU/3D job, and IDE runtime caps transactionally.
- [ ] Automatically stop expired/idle workspaces and reconcile still-running pods, disks, volumes, and GPUs.
- [ ] Set actual provider budget controls, alerts, and auto-recharge restrictions; alerts alone are not a hard spending cap.
- [ ] Notify existing Free users in advance and preserve access to their projects and export options.

**Done when:** Expired, canceled, free, and over-limit accounts cannot create *new* chargeable operations; previously running resources are handled separately.

## P0 — Recover infrastructure and reduce hosting costs

- [ ] Recover/export Google Cloud VM disks, configs, Coder workspace data, secrets inventory (names only), and backups before deleting anything.
- [ ] Follow up on Google Cloud billing and Railway restriction appeals; do not assume either provider has restored service.
- [ ] Compare fixed-price Linux VPS providers, including OVHcloud, for total CPU, RAM, disk, bandwidth, and backup costs.
- [ ] Keep the public website/backend on a small CPU VPS; use GPU capacity **on demand** for Alice and 3D tests.
- [ ] Configure Ubuntu, SSH keys, firewall, Docker, secrets, automatic security updates, backups and recovery.
- [ ] Restore the site/backend; verify HTTPS, DNS, reverse proxy, Supabase, persistence, and health endpoints.
- [ ] Smoke-test a single Coder IDE workspace, persistence, stop/restart, and resource usage.
- [ ] Confirm actual monthly base and variable usage costs, stop-cost procedure, and rollback plan.

**Done when:** The production stack can be redeployed from a tested backup and one isolated IDE passes health and persistence tests.

## P1 — Finish the three-step builder

- [ ] Test and fix registration, login, logout, session recovery, and project permissions.
- [ ] Fix creating/loading/saving projects without invented default projects or fake success messages.
- [ ] Complete choose/create-template flow and real navigation routes.
- [ ] Make drag-and-drop editing, responsive design, and live preview reflect persisted changes.
- [ ] Connect Alice to **real** code generation; clearly state when the AI backend is unavailable.
- [ ] Validate prompt-based full-stack generation and image-to-design workflows with secure sanitization.
- [ ] Complete publish/unpublish, deployment states, failure recovery, and project export.
- [ ] Validate the whole register → template → edit/preview → publish flow on mobile and desktop.

**Done when:** A real test user can complete the entire journey, or a real unavailable dependency is identified honestly.

## P1 — Fix Stripe, pricing, trial, and subscriptions

- [ ] Reconcile live Stripe products/prices with `apps/web/lib/billing/public-plan-catalog.ts`, pricing pages, and docs.
- [ ] Verify actual allowances and profitability before promoting Creator, Architect, Studio, Guild, and Enterprise tiers.
- [ ] Implement trial activation/expiry and payment-method verification without accidental auto-conversion.
- [ ] Verify signed Stripe webhooks for checkout, renewals, cancellations, failed payments, and upgrades.
- [ ] Verify Supabase entitlements come from real Stripe state, not client-reported plan names.
- [ ] Enforce AI, 3D, storage, and IDE usage limits across services before paid compute is enabled.
- [ ] Replace fabricated spend/usage figures with verified metering, real billing controls, and clear limit messages.
- [ ] Test the full trial-to-paid and cancellation flow in test mode and a nonproduction DB before any live changes.
- [ ] Ensure existing users' projects remain accessible/exportable when trial/plan access ends.

**Done when:** UI pricing matches Stripe, payment state gates all expensive operations, and an expired trial cannot generate additional spend.

## P2 — Alice, 3D generation, and WonderSpace

- [ ] Benchmark Alice on a temporary SSH-accessible GPU and record GPU memory, latency, and per-request cost.
- [ ] Validate Alice's multi-file output, build feedback, honest failures, and safe code generation.
- [ ] Test text-to-3D and image-to-3D, including saved/downloadable `.glb`/`.gltf` assets.
- [ ] Implement authenticated job queues, timeout/retry limits, quotas, and real job status across AI/3D.
- [ ] Verify synchronization of projects, assets, and sessions among website, IDE, Playground, and 3D.
- [ ] Confirm WonderSpace repository dropdown, external repository URLs, SSH/terminal, and persistence.
- [ ] Test IDE idle-stop/restart, allocation limits, storage costs, and removal of paid resources.
- [ ] Verify that provider outages, missing GPUs, and API failures cannot appear to users as completed jobs.

## P3 — Get the first paying customers

- [ ] Update homepage, pricing, dashboard, onboarding, support docs, and trial messaging consistently.
- [ ] Notify existing users before modifying current free-tier access; explain trial limits and how to export projects.
- [ ] Show exactly which features are included in the trial and which require a subscription.
- [ ] Prepare one realistic working demo template and a short builder walkthrough.
- [ ] Test signup → start trial → complete build → explicitly buy plan → use paid feature.
- [ ] Create a small cost-capped promotion only after Stripe coupons and usage limits are tested.
- [ ] Track conversion, successful projects, cancellations, support requests, and **actual per-customer infrastructure cost**.

**Initial goal:** A working builder, safe capped trial, and the first few paid Creator subscriptions—not unrestricted free compute.

---

## Must-pass release gates

- [ ] Verify staging CI/build and production smoke tests before deploying pricing or cost gates.
- [ ] Validate DB migrations against the real Supabase schema in a nonproduction database; obtain approval before production migrations.
- [ ] Apply provider-level cost limits and verify idle shutdown/expiration enforcement before customer GPU/IDE access.
- [ ] Confirm backups and restore tests before deleting or migrating the Google Cloud/Railway resources.
- [ ] Obtain explicit approval before changing live Stripe subscriptions, customer entitlements, pricing, or production systems.

## Existing technical references

- [Cost guard rollout (NOT fully deployed)](docs/operations/COST_GUARD_ROLLOUT.md)
- [Coder pod safeguards](docs/operations/CODER_POD_SAFEGUARDS.md)
- [Public plan catalog](apps/web/lib/billing/public-plan-catalog.ts)
- [Plan definitions](apps/web/lib/billing/plans.ts)
- [Server-side cost guard](apps/web/lib/billing/cost-guard.server.ts)

This is a **tracking file**, not a deployment or a claim that safeguards are already working.
