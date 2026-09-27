# Verify the existing AWS EKS IDE cluster without enabling customer pods

This is the direct EKS check, **not** the old SSH-based AWS fallback web-VM
preflight. The primary IDE infrastructure is `coder-cluster` in `us-east-1`;
Railway hosts web/API and **does not run customer Kubernetes pods**.

## One-time GitHub / AWS setup

Create a dedicated AWS IAM role trusted by this repository's GitHub Actions OIDC
identity. Limit its trust subject to reviewed runs on
`repo:AI-WonderLand1/dreammakerhub.website:environment:production`, and restrict
the corresponding GitHub environment to `Master` and approved operators.
Restrict AWS IAM to at most `eks:DescribeCluster` on the pinned
`coder-cluster` ARN. AWS STS `GetCallerIdentity` needs no extra identity policy
grant. Separately grant this IAM role **read-only** Kubernetes RBAC for the
existing cluster's nodes, namespaces, policy resources, service accounts,
deployments, pods and storage classes, **without** Kubernetes impersonation. Use the reviewed
`infra/coder/github-readiness-inventory-rbac.yaml` manifest for a dedicated EKS
access-entry group named `wonderspace-readiness`, then apply it from a trusted
cluster-admin environment (NOT from GitHub Actions). The GitHub run performs
only unprivileged inventory checks. Never grant this group writes, secrets
read, impersonation or broad cluster administration. IAM and Kubernetes access are separate.

Set GitHub **repository variable** `AWS_EKS_READ_ONLY_ROLE_ARN` to the full ARN.
Set `AWS_EKS_ACCOUNT_ID` to the intended 12-digit account ID to pin account
identity. There are no long-lived AWS keys or SSH keys in this workflow.

Go to GitHub **Actions → AWS EKS WonderSpace customer readiness (read only) →
Run workflow** on `Master` after review/merge. GitHub's disposable Ubuntu VM
then verifies AWS identity, obtains the pinned EKS kubeconfig and checks the
current customer namespace isolation manifests in
`infra/coder/aws-customer-pod-preflight.sh`. Missing or differently named
objects will be reported as failures. A pass only means inventory objects can
be read, NOT that the provisioner's RBAC or security isolation is proven.

Independently run privileged `kubectl auth can-i --as` provisioner isolation
checks from a trusted administrator context, after reviewing the target
service account's rights. Never run those impersonation checks with the
GitHub role or grant GitHub the impersonation verb. Compare the result with the actual
cluster: do not rename, delete or apply Kubernetes resources automatically.

## A passing preflight is not permission to unpause

Even when every object exists, this does not verify network policy CNI
enforcement, image digest/vulnerability scans, distinct Coder OIDC customer
accounts, per-user terminal/IDE/PVC isolation, adequate node capacity or an
independent enforced account-wide compute hard stop. Test those separately,
with disposable paid pilot users, before enabling
`CODER_CUSTOMER_PROVISIONING_ENABLED`,
`CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED`,
`CODER_CUSTOMER_HARD_STOP_VERIFIED`,
`CODER_SUPABASE_OIDC_VERIFIED`, or other billable flags.

### Existing owner IDE access

The operator UI requires exactly one trusted Supabase UUID in the server-only
`CODER_OPERATOR_SUPABASE_ID` variable, or exactly one UUID in
`ADMIN_USER_IDS` as fallback. Never derive an operator identity from a
public browser field or give the shared Coder token to customers. A missing
operator variable affects the existing owner's shortcut but is **separate**
from customer creation readiness.
