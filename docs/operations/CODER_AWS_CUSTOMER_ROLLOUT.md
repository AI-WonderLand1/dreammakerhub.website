# AWS Coder customer IDE rollout (not deployed)

**Status:** customer creation remains paused. This checklist does not configure AWS, change Coder's deployed template, create pods, or establish two-user isolation.

## Existing resources and scope

- Preserve the operator's `wonderingtribe/production` workspace, its persistent disk, and any other existing Coder workspaces. Never repurpose the operator token or owner as a customer account.
- `infra/coder/template/main.tf` defines a **Linux Kubernetes pod and PVC** when published as an active Coder template and started by a configured Kubernetes provisioner. Merely having the Terraform in GitHub does not publish it or create a workspace. `infra/coder/ROOT_IDE_SETUP.md` describes publishing.
- `.github/workflows/deploy-aws-fallback.yml` deploys the **web application Docker image** to an AWS VM when manually invoked. It does **not** install Kubernetes, the Coder control plane, Coder templates, an AWS customer compute cluster, or per-user authentication.
- Before choosing EKS versus a self-managed Kubernetes cluster on AWS, verify the actual Coder host, active template, existing cluster context, PVC storage class, node capacity, billing limits, and ingress. Do not guess that the three healthy Coder provisioner daemons provide customer compute capacity.

## Required work before enabling customers

1. Identify and confirm which AWS account/region/instance or cluster hosts `coder.dreammakerhub.website` and inspect the live Coder deployment. Preserve existing workspaces and make a backup of Coder metadata/PVCs before template or cluster changes.
2. Publish a distinct, operator-maintained Linux Kubernetes template only after checking the live provisioner has the `coder` namespace permissions and storage class. Keep `code-server` owner-only and the workspace app behind authenticated HTTPS; verify wildcard DNS/TLS.
3. Configure an actual identity federation/provisioning path that maps a verified Supabase Auth UUID to a distinct Coder user ID. Authorize workspace create/list/open/start/stop/delete by immutable Coder ID and the server-side `coder_workspace_slots.user_id` mapping, not browser-submitted IDs or an operator-owned token.
4. Implement a server-side cumulative **running compute** ledger and reconciler. Enforce a chosen per-plan numerical allowance and renewal window before start and stop/verify exhausted workspaces. Idle autostop and a visible countdown are not hard cumulative limits. Add namespace CPU/memory/storage quotas and a provider cost cap.
5. Test two separate accounts (including direct Coder links, terminal, SSH, ports, files, and API) for cross-tenant denial; test quota exhaustion, stale sessions, outages and restart bypass attempts. Confirm each receives a different pod/PVC and never the `wonderingtribe/production` workspace.
6. Only after a real AWS staging test and observed stop/reconciliation behavior should an operator consider enabling both billing and Coder-creation switches in the actual production runtime. Do not set switches merely to make UI errors disappear.

## Protective source change in this PR

`apps/web/app/api/user-workspace/provision/route.ts` now calls `assertCoderOwnerIsolation(user.id)` immediately after Supabase authentication, before parsing the launch request, fetching templates, running a Coder health check, or calling the Coder API. `reserveCoderSlot` retains its independent guard. This narrows exposure of the shared Coder owner; it **does not** implement customer identities, AWS compute, or the time meter.
