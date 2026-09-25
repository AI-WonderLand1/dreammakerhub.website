# WonderSpace AWS customer pod smoke template

This template is intentionally **not production-ready**. It exists only to prove that the new AWS Coder control plane can create a private Kubernetes Deployment and persistent volume in `coder-customers`.

It is limited to one Micro-sized IDE container (1 CPU / 2 GiB limit, 10 GiB PVC). It uses a tag-based base image and installs code-server at workspace startup. The production template remains `infra/coder/customer-template/main.tf`, which requires reviewed digest-pinned images.

## Before pushing

1. Confirm the new AWS Coder pod and database are running in namespace `coder`.
2. Confirm `coder-customers` exists.
3. Confirm `system:serviceaccount:coder:coder-workspace-provisioner` can create PVCs and Deployments in `coder-customers`.
4. Confirm the workspace agent can reach the **new AWS Coder deployment's actual configured access URL**. The proposed customer NetworkPolicy permits public HTTPS (TCP 443), not `http://coder.coder.svc.cluster.local` on port 80. Verify actual DNS/TLS and network egress before testing, or review and explicitly permit a narrowly scoped alternative. Do not point agents at the old public Coder installation or change production DNS to force a smoke test.

## Publish from a shell authenticated to the NEW AWS Coder

```bash
coder templates push wonderspace-customer-smoke \
  --directory infra/coder/customer-smoke-template \
  --yes
```

Create a smoke workspace:

```bash
coder create aws-customer-smoke \
  --template wonderspace-customer-smoke \
  --yes
```

Watch Kubernetes:

```bash
kubectl get pods,pvc -n coder-customers -w
```

Success means a `customer-<workspace-uuid>-...` pod reaches Running and its 10 GiB PVC is Bound.

## Cleanup

```bash
coder delete aws-customer-smoke --yes
```

Do not use this smoke template for real customer accounts.
