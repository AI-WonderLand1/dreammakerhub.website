# DreamMakerHub private customer IDE pilot (NOT enabled)

This branch is a **reviewable implementation**, not a live deployment. The current operator Coder workspaces (`production`, `WonderSpace`, etc.) and their published templates must not be edited or deleted. The published `WonderSpace-ide-template` shown in Coder is **not** interchangeable with the separate candidate Terraform source in `infra/coder/customer-template/main.tf` until deliberately imported and reviewed.

## What the code now contains

- One template blueprint creates a *different Coder owner, workspace ID, Kubernetes Deployment/pod, and persistent PVC* per accepted customer request. The customer form allows a 10 GiB disk, 1–2 CPUs and 2–4 GiB RAM for the initial budget-capped pilot. Do **not** advertise the live template's 6/8 CPU choices: they exceed the current safe app budget.
- The `/api/user-workspace/customer/provision` endpoint binds a verified site user to exactly one active Coder `oidc` account with the same confirmed email, verified again by ID. It rejects the configured Coder operator UUID. A globally unique database mapping stops two site accounts claiming the same Coder owner.
- The endpoint validates the *pinned, published customer template*, requires a fresh usage-controller heartbeat, reserves a durable slot, then queues a job. A secret-authenticated runner claims each job atomically, checks ownership again, creates the workspace using `/api/v2/users/{customer-coder-uuid}/workspaces`, verifies the owner in the response, and records usage. Claimed/uncertain jobs are never retried or released automatically.
- A separate secret-authenticated controller records cumulative observed running time with a locked database function and submits a Coder stop build at the configured limit. All browser access to these tables and worker routes is denied. The runner does not return a Coder token or an unverified IDE URL.

## Required before a live pilot

1. Review PR and run `npx vitest run tests/coder-customer-runner.test.ts tests/coder-customer-isolation.test.ts`; run `terraform fmt -check` and `terraform validate` with the approved image variables. Audit migrations before applying them. None are applied by the PR.
2. Configure Supabase as an OIDC issuer and Coder as its confidential client. Use verified issuer, callback, exact email and OIDC user identity; preserve the operator's GitHub login. Coder `/api/v2/users/authmethods` must report `oidc.enabled=true`, and **two independent real test users** must log in to Coder to establish their accounts. `customers` group currently having zero members does not establish identity. Never manufacture a Coder account by writing an arbitrary UUID in a database.
3. Publish the customer-only template from `infra/coder/customer-template/main.tf` as a *new* Coder template. Build and scan immutable Linux/Node images with code-server pre-installed; provide `linux_image` and `node_image` as verified `@sha256` references. Confirm that a pod using a read-only root filesystem can run the image. Record the new template UUID, active version UUID and exact name. Do not reuse any operator template UUID.
4. Configure `coder-customers` namespace, its ResourceQuota/NetworkPolicies, and a dedicated least-privilege Coder provisioner identity with permissions only in that namespace. Test DNS and outbound HTTPS for the Coder agent. Verify the cluster's CNI enforces NetworkPolicies, that other namespaces cannot read customer PVCs or secrets, and that customer pods receive no Kubernetes service-account token. Review `infra/coder/customer-isolation.yaml` before applying; its networking assumptions may not match the actual cluster.
5. Deploy and observe the controller and runner schedules. Install a reviewed, digest-pinned worker image and a dedicated random 32+ character `CODER_CUSTOMER_RUNNER_SECRET` as a Kubernetes Secret and server runtime variable. No tokens in source, UI, logs, or browser. Test two simultaneous submissions, creation timeout/reconciliation, pod restart and persistent disk, over-limit stop, and unauthorized cross-customer API, IDE, preview and terminal access.
6. **Independent hard-stop fail-safe is still missing.** The one-minute controller is NOT a guarantee when the website, scheduler, network, Coder API, or database is down; Coder inactivity TTL can be extended by an open IDE. Add and verify an independent enforceable runtime cutoff or fail-safe controller before setting `CODER_CUSTOMER_HARD_STOP_VERIFIED=true`. Forbid re-starting a workspace whose cumulative allowance is exhausted, including through Coder's own UI. Until then customer creation must remain OFF.
7. A secure, isolated-origin IDE gateway is still needed for the promised *never leave DreamMakerHub* experience. It must bind DreamMakerHub session to the exact Coder owner and workspace, support WebSockets, preserve per-user cookie isolation and block cross-workspace port previews. Do not simply iframe an unauthenticated code-server URL or proxy the Coder admin token. **This browser gateway is not a prerequisite for preparing a private pod/PVC during an operator-controlled pilot**; the customer Open IDE route remains fail-closed until the gateway is independently verified.

## Runtime configuration (all OFF by default)

Keep existing `CODER_WORKSPACE_OWNER`, operator token, and operator templates unchanged. New customer variables:

- `CODER_OPERATOR_USER_ID`: verified UUID from Coder `/api/v2/users/me` using the existing operator token, not the Supabase UUID.
- `CODER_OPERATOR_TEMPLATE_ID`: the existing personal IDE template UUID; customer template must differ.
- `CODER_CUSTOMER_TEMPLATE_ID`, `CODER_CUSTOMER_TEMPLATE_VERSION_ID`, `CODER_CUSTOMER_TEMPLATE_NAME`: exact, published and reviewed dedicated customer template.
- `CODER_PRO_COMPUTE_MINUTES`, `CODER_TEAM_COMPUTE_MINUTES`: **explicit business decisions**; the code does not invent paid plan allowances. Each must be an integer 1–1440 before accepting a job.
- `CODER_CUSTOMER_RUNNER_SECRET`: unique random 32+ character secret shared ONLY between web server and worker.
- `CODER_CUSTOMER_CONTROLLER_ENABLED=true`: only after controller scheduling is deployed and verified.
- `CODER_SUPABASE_OIDC_VERIFIED=true`: only after both test accounts sign into Coder with the same Supabase issuer.
- `CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED=true`: only after independent pod/PVC/network/RBAC/capacity testing.
- `CODER_CUSTOMER_HARD_STOP_VERIFIED=true`: **must remain false** until an independent failure-proof cutoff and prevention of out-of-band restarts are implemented and tested.
- `CODER_CUSTOMER_PROVISIONING_ENABLED=true`: LAST, after every prerequisite passes. Existing billing switches must also be on for verified paid users.

Never infer any of these values from a screenshot, table count, passing unit tests, or a Coder health badge. When provisioning is enabled, the current WonderSpace page may display the customer pod form for non-admins while leaving the operator flow intact. Pod creation remains subject to the identity, template, controller, hard-stop and billing gates above. It intentionally does not yet provide a working in-site IDE gateway.
