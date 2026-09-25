# Install the customer worker schedulers safely on EKS

This prepares the **existing** DreamMakerHub customer runner and usage controller; it does not add an AI agent. Both Kubernetes CronJobs are installed **suspended**. No scheduled request, Coder pod, customer identity, production database migration, DNS change, or billing operation is enabled by this installer. Preserve operator workspaces and PVCs.

## Verified repository and database status (2026-09-25)

- API routes already exist at /api/internal/coder/customer-runner and /api/internal/coder/customer-usage, both requiring the same private bearer secret.
- Production Supabase project named dreammakerhub.website has the customer jobs, identities, usage and controller tables, but inspection found zero registered customer Coder identities, zero customer jobs and no fresh controller heartbeat.
- Production Supabase currently exposes meter_coder_customer_compute, **not** the meter_coder_customer_compute_v2 RPC currently called by the usage controller. The newer source migration `supabase/migrations/202609230500_coder_machine_profiles.sql` is not in production migration history. Review, test and separately apply it after checking schema dependencies, RLS, and potential duplicate constraints. DO NOT activate workers before that.
- An independent enforceable compute hard-stop and verified two-customer identity/isolation testing remain prerequisites for public creation. Do not set CODER_CUSTOMER_HARD_STOP_VERIFIED or CODER_CUSTOMER_PROVISIONING_ENABLED to true until independently verified.

## One-time preflight from AWS CloudShell or your trusted EKS admin shell

Clone/check out this PR after review (or fetch the merged Master version). Install AWS CLI, kubectl and jq.

```bash
aws eks update-kubeconfig --region us-east-1 --name coder-cluster --alias coder-aws-repair
aws eks describe-cluster --region us-east-1 --name coder-cluster --query cluster.arn --output text
kubectl config current-context
```

Confirm the output ARN is the intended AWS account/cluster. Set your expected ARN **locally**, without changing any project secrets:

```bash
export EXPECTED_KUBE_CONTEXT=coder-aws-repair
export EXPECTED_CLUSTER_ARN='<VERIFIED ARN OUTPUT FROM THE COMMAND ABOVE>'
export AWS_REGION=us-east-1
export EKS_CLUSTER=coder-cluster
bash infra/coder/install-paused-customer-workers.sh --check
```

Read-only checks confirm kubeconfig/EKS endpoint and exact ARN match, namespace presence, coder deployment, access to nodes and visible storage classes. They do **not** prove customer provisioner RBAC, EBS CSI health, CNI isolation or workload readiness. Run the existing read-only AWS customer pod preflight after installing and reviewing the customer namespace policies; note that workflow targets the configured AWS fallback SSH host and might not have a Kubernetes context.

## Before installing the suspended CronJobs

1. Confirm the running website's `CODER_API_URL` points to the intended Coder server and `CODER_CUSTOMER_RUNNER_SECRET` is a privately generated random secret of at least 32 characters. Source it privately from your approved secret manager; never copy it into GitHub files, screenshots, logs or chat.
2. Create a Kubernetes Secret named `coder-customer-runner`, key `token`, in namespace `coder`, **containing exactly the same value** as the running website's `CODER_CUSTOMER_RUNNER_SECRET`. Check this outside the repository. The installer verifies the Kubernetes secret key exists but cannot verify its equality with a separate website secret.
3. Build/review and scan an approved curlimages/curl image, resolve its immutable `curlimages/curl@sha256:<64 hex>` digest, and set `PINNED_CURL_IMAGE` accordingly. An example command to inspect the digest (verify against your image supply chain): `docker buildx imagetools inspect curlimages/curl:8.16.0`. Do not copy an example digest from an untrusted page.
4. Verify EKS node capacity, StorageClass, Coder provisioner credentials and least-privilege namespace RBAC. The cron installer does **not** wire an external Coder provisioner or install cluster policies.
5. After these checks, explicitly authorize ONLY the suspended CronJob installation:

```bash
export PINNED_CURL_IMAGE='curlimages/curl@sha256:<VERIFIED_64_HEX_DIGEST>'
export CONFIRM_INSTALL_PAUSED=INSTALL_SUSPENDED_ONLY
bash infra/coder/install-paused-customer-workers.sh --install-paused
kubectl --context coder-aws-repair -n coder get cronjob coder-customer-usage coder-customer-runner
```

Expected: both rows show `SUSPEND=true`. This is not a test of successful requests: suspended schedules cannot run.

## Next: one private smoke pod, then a production pilot

First review and merge the separate smoke Terraform provider fix in PR #571. Verify authenticated Coder points to the actual AWS control plane and agents can reach the configured access URL through the reviewed customer NetworkPolicy. Follow `infra/coder/customer-smoke-template/README.md` to publish its **nonproduction** template and create ONE smoke pod and PVC. Do not repurpose or expose the operator's existing workspace.

To authorize customer provisioning later, independently review/apply the missing Supabase migration, verify two different Supabase/Coder OIDC identities, publish a new digest-pinned production customer template, and prove a separate hard-stop enforcement route even if the website or scheduler fails. Only then review enabling the usage controller and queue worker in that order. This installer intentionally has **no activate command**; a second reviewed change is necessary before public activation. Customer creation and all verification switches stay OFF.

**Rollback:** leave both CronJobs suspended. If installed and no longer wanted, review and delete ONLY `coder-customer-runner` and `coder-customer-usage` CronJobs in namespace `coder`; do not delete the shared secret, operator workspace, namespace or any customer PVC as part of scheduler rollback.
