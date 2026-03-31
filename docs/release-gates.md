# Release Gates Checklist

Use this checklist before requesting production deployment approval.

## Scope

This gate covers:

- Sign up / login / logout / password reset
- Wonderspace project create / list / open / update / delete
- Wonderspace artifact upload / list / download

---

## 1) Automated Gates (required)

Run the automated suite:

```bash
bash scripts/release-gates-check.sh
```

Expected result: required checks pass. The best-effort artifact route check may warn and defer to manual verification when environment dependencies are unavailable.

### Automated commands executed by the script

- `pnpm vitest run tests/wonderspace-projects-route.test.ts`
- `pnpm vitest run tests/wonderspace-artifacts-schema.test.ts`
- `pnpm vitest run tests/wonderspace-theia-app.test.ts`
- (Best effort) `pnpm vitest run tests/wonderspace-artifacts-routes.test.ts`

---

## 2) Manual Gates (required)

Complete each item in a staging or pre-production environment and record evidence (URL, screenshot, log link, or trace ID).

### A. Auth flows

- [ ] Sign up creates a new account and lands on the expected post-auth page.
- [ ] Login works for an existing account.
- [ ] Logout invalidates session and protects authenticated routes.
- [ ] Password reset flow sends token/link and allows setting a new password.

Evidence:

- [ ] Attached / linked

### B. Wonderspace project flows

- [ ] Create project (valid name + default metadata).
- [ ] List projects includes newly created project.
- [ ] Open project loads expected content and metadata.
- [ ] Update project persists changes and reflects in listing/detail views.
- [ ] Delete project removes it from list and blocks reopening.

Evidence:

- [ ] Attached / linked

### C. Wonderspace artifact flows

- [ ] Upload artifact succeeds for supported file types/sizes.
- [ ] List artifacts shows uploaded artifact metadata.
- [ ] Download artifact returns expected file/content integrity.

Evidence:

- [ ] Attached / linked

---

## 3) Release gate sign-off

- [ ] Automated gates passed in CI.
- [ ] Manual gates completed with evidence attached.
- [ ] Reviewer acknowledged completion by running the `release_gates_manual` CI job.

