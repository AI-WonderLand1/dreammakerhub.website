# DreamMakerHub launch TODO
**Prepared:** September 26, 2026  
**Target launch:** October 14, 2026 (18-day preparation window)  
**Rule:** Fix launch blockers before building new features. Unchecked means not yet verified end to end, not necessarily unimplemented. Link fixes to an issue/PR, passing CI, the deployed commit, and a real test result.

## P0 — Fix these first, in this order

### 1. Protect existing infrastructure and customer data (Sept 26)
- [ ] Inventory anything still on UpCloud (including Coder database/volumes, local uploads and DNS dependencies); take and test backups **before** shutting anything down. Do not overwrite existing Coder data. [Migration #581](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/581)
- [ ] Confirm Railway website, AI-PLAYGROUND and wonderplay-3D actually answer their intended URLs after their successful deployments; independently check DNS, TLS, health endpoints and real browser functionality. Attached Railway domains and a green deployment are not enough. [#581](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/581)
- [ ] Resolve or explicitly retire Railway's failed **Postgres** service. It previously built the website instead of a database; verify its source, data/volume needs and dependents. Keep production Supabase separate; do not restore critical data to unverified storage. [#581](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/581)
- [ ] Preserve AWS EKS/Coder and Zoho MX/SPF/DKIM/DMARC while correcting Cloudflare records; record rollback targets before any DNS cutover. [#581](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/581)

### 2. Make WonderSpace work for real customers (Sept 27–Oct 2)
- [ ] Fix existing production Coder code-server access, redirects, TLS and WebSocket behavior **without recreating** or deleting the owner's workspace. Capture actual failing responses/logs first. [#546](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/546)
- [ ] Verify customer auth bridge, Coder credentials/configuration, runner, template, Kubernetes service account/RBAC, pod creation and persistent volume attachment on AWS.
- [ ] Test **two separate non-admin accounts**: each submits the form, gets an isolated private pod/workspace, can use files/terminal, suspend/resume and delete, and cannot access the other's data. Record pod/namespace/owner evidence without exposing tokens. [Launch audit #484](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/484)
- [ ] Set explicit account-wide monthly compute allowances. Atomically enforce total compute across old and new workspace slots, including delete/recreate and direct starts through Coder; verify hard-stop, quotas and billing before enabling the customer pilot. Do not enable unverified provisioning flags. [#553](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/553)

### 3. Prevent lost or fabricated customer work (Sept 29–Oct 2)
- [ ] Verify merged project-persistence fixes in a live authenticated flow: blank/template/AI start -> real owned project -> builder -> save -> logout -> reload -> preview -> publish. Distinguish storage errors from success; never fabricate a saved project. [#484](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/484)
- [ ] Fix missing-source rename, destination collisions, multi-file validation/partial-save behavior and accurate delete results; test cross-account access and retry behavior on **staging test projects only**. [#515](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/515)

### 4. Make payments and permissions trustworthy (Oct 3–6)
- [ ] Preserve chosen plan and billing interval through login and Stripe Checkout; test configured prices, failed and successful checkout and cancellations in **Stripe test mode**. Never activate subscriptions from a success URL alone. [#513](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/513)
- [ ] Grant/withdraw paid features only from verified Stripe events and authoritative subscription state. Agree on ONE plan/entitlement table and enforce matching AI, workspace and compute limits server-side. [#513](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/513), [#496](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/496)
- [ ] Confirm account/project authorization, secure generated HTML/URLs/CSS, and verify six Supabase tables flagged with RLS enabled but no policy are intentionally **server-only**. Enable leaked-password protection as appropriate and test signup. Do not add permissive policies merely to clear an advisory. [#497](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/497)

### 5. Restore reliable release gates (Oct 3–6)
- [ ] Reconcile npm lockfile; verify a clean Node 22 npm ci/install, build and test without production secrets. [#495](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/495)
- [ ] Fix real TypeScript and lint errors, remove the current ignoreBuildErrors bypass, make typecheck/lint/tests required on the **release commit**, and confirm deployment smoke tests. [#516](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/516), [#492](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/492)

## P1 — Customer-facing launch verification (Oct 7–10)
- [ ] With fresh customer accounts, verify signup/login/logout, dashboard, blank/template/AI WonderBuild paths, drag/drop, real provider replies, save/reload and publish. Preserve **Start -> Build (+ Preview) -> Publish**; no new wizard screens. [#484](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/484)
- [ ] Test AI-PLAYGROUND and NPC-AI-SIM/WonderPlay in actual browsers; verify asset loading, correct API/provider responses, 3D viewport and supported export operations. Do not mistake a successful container build for a working product. [#484](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/484)
- [ ] Run mobile/desktop navigation, docs links, keyboard accessibility, error states, email delivery and customer support checks.
- [ ] Set up meaningful production monitoring and alerting for auth, project saves, Stripe webhooks, Coder provisioning, API errors and service health; test a restore/rollback.

## P2 — Launch packaging and freeze (Oct 11–13)
- [ ] Use authentic screenshots and record a 60–90 second walkthrough **only** of verified working features; keep marketing/pricing claims consistent with the product.
- [ ] Verify Product Hunt/startup listing text, working signup links, docs, support/contact addresses and launch announcements.
- [ ] Run a final clean release-commit CI + production smoke test; freeze features; record owner, test evidence and rollback procedure for each release gate.

## October 14: Go/no-go gates (ALL must pass)
- [ ] **Security:** two customer accounts are isolated across site projects, Coder pods, storage and billing.
- [ ] **Core workflow:** new customer creates, edits, saves, reopens, previews and publishes without data loss.
- [ ] **IDE:** if advertised as live, customer-created WonderSpace pods actually run, persist and enforce account budgets; otherwise label the IDE as a waitlist/beta, not available.
- [ ] **Billing:** Stripe-verified subscription state controls paid features and published entitlements match enforced limits.
- [ ] **Operations:** current release passes CI, production smoke tests, monitoring and tested rollback/backup restoration.

**If any required gate fails:** postpone public paid onboarding or reduce launch scope to the subset that has passed. Do not represent untested features as available.

## Not for the 18-day critical path
- New gaming storefront/catalog and real-money product checkout [#566](https://github.com/AI-WonderLand1/dreammakerhub.website/issues/566).
- Training a foundation model, new 3D engines, major builder redesigns, and optional integrations.
- Retiring UpCloud before backed-up services have verified Railway/AWS replacements.

## Verified starting point (Sept 26; recheck before closing tasks)
- Railway latest deployments: main website, AI-PLAYGROUND and wonderplay-3D **SUCCESS**; Railway Postgres **FAILED**.
- Railway custom domains are attached, but that alone does not validate public DNS/TLS or customer functionality.
- Main DreamMakerHub Supabase project reports **ACTIVE_HEALTHY**; isolated customer IDE provisioning, real subscriptions and complete end-to-end publishing are **not verified**.
- Existing 76 KB historical root TODO.md is recoverable through Git history and related GitHub issues; this file replaces it as the short, ordered launch checklist.
