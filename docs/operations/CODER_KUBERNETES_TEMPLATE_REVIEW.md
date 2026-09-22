# Kubernetes IDE template review

The `infra/coder/template/main.tf` source defines a Linux-only `amd64` workspace Kubernetes Deployment and per-workspace PVC in namespace `coder`. The file alone is not an active Coder template or a running workspace. Existing operator workspaces in the dashboard are not evidence that customer pods are running on AWS.

## Observed configuration versus verified operation

- `coder_app.code-server` has `share = "owner"` and binds the editor to `127.0.0.1` with Coder proxying it. It requires tested Coder authentication and wildcard HTTPS in the live deployment.
- The template offers up to **4 CPU / 8 GiB**, while the website guard currently limits API-created workspaces to **2 CPU / 4 GiB**. Direct Coder access could bypass the website cap unless permissions/template bounds and cluster quotas are independently enforced.
- The PVC size parameter allows **1–50 GiB** in the template while the website requests 10 GiB. A stopped workspace can retain and incur charges for its PVC.
- `locals.default_ttl`, `locals.max_ttl`, and variable `autostop` are declared but not consumed in `main.tf`. The website requests `ttl_ms`, an inactivity setting, not cumulative runtime accounting. None of these enforce a hard per-user total.
- `code-server` is downloaded by an unpinned install script during agent startup. A published customer template should pin and verify an approved immutable build before production rollout.
- This template does not provide a Windows OS. Windows requires its own verified Windows-capable host/cluster and template; changing the Linux label cannot produce it.

**No active Coder template, AWS cluster, storage class, cloud budget, user identities, or time metering were verified by this source review.** Do not publish a new version over `wonderingtribe/production` or enable customer creation based on this document. See `CODER_AWS_CUSTOMER_ROLLOUT.md` and GitHub issue #529.
