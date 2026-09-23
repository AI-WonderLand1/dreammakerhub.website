#!/usr/bin/env bash
# READ ONLY. Inspect the actual AWS Kubernetes context before any customer pod
# rollout. This script never applies YAML, creates pods or prints credentials.
set -euo pipefail

fail() { printf 'BLOCKED: %s\n' "$*" >&2; exit 1; }
info() { printf 'CHECK: %s\n' "$*"; }

command -v kubectl >/dev/null 2>&1 || fail 'kubectl is not installed on this AWS host; a Docker web VM is not an established Kubernetes cluster.'
actual_context="$(kubectl config current-context 2>/dev/null)" || fail 'No usable kubeconfig/current context on this AWS host.'
# The first run can discover the configured context without reading resources
# from a potentially unrelated cluster. Pin it before a second, deeper scan.
if [[ -z "${EXPECTED_KUBE_CONTEXT:-}" ]]; then
  info "Discovered Kubernetes context on this AWS host: $actual_context"
  fail 'Verify that this is the intended AWS customer cluster, set AWS_CODER_KUBE_CONTEXT to that exact value in GitHub, then rerun the read-only preflight.'
fi
[[ "$actual_context" == "$EXPECTED_KUBE_CONTEXT" ]] || fail "Kubernetes context does not match verified AWS_CODER_KUBE_CONTEXT (actual: $actual_context)."
info "Verified expected Kubernetes context: $actual_context"

kubectl --request-timeout=15s get nodes -o name >/dev/null || fail 'Cannot read AWS Kubernetes nodes with the current credentials.'
kubectl --request-timeout=15s get namespace coder-customers -o name >/dev/null || fail 'Separate coder-customers namespace has not been installed.'
# The Coder control plane may live on UpCloud or elsewhere. Do not require an
# operator "coder" namespace on the AWS workspace cluster.
operator_namespace_present=false
if kubectl --request-timeout=15s get namespace coder -o name >/dev/null 2>&1; then
  operator_namespace_present=true
else
  info 'No operator Coder namespace found here; a separate AWS-connected Coder provisioner will be required.'
fi
info 'The separate customer namespace exists; no namespace was created.'

for object in \
  'resourcequota/customer-pilot-cap' \
  'limitrange/customer-pilot-limits' \
  'networkpolicy/customer-default-deny' \
  'networkpolicy/customer-dns' \
  'networkpolicy/customer-public-https' \
  'serviceaccount/coder-customer-provisioner' \
  'role/coder-customer-provisioner' \
  'rolebinding/coder-customer-provisioner'; do
  kubectl --request-timeout=15s -n coder-customers get "$object" -o name >/dev/null || fail "Missing customer-only Kubernetes resource: $object"
done
kubectl --request-timeout=15s get namespace coder-customers -o json |
  grep -Eq '"pod-security.kubernetes.io/enforce"[[:space:]]*:[[:space:]]*"restricted"' ||
  fail 'Customer namespace must enforce the restricted Pod Security Standard.'
info 'Customer quota, size limits, pod restrictions, network policies and dedicated provisioner RBAC objects exist.'

subject='system:serviceaccount:coder-customers:coder-customer-provisioner'
authorize() {
  # A missing impersonation privilege is inconclusive and must not be treated
  # as a successful denial. Keep rollout blocked in that case.
  kubectl --request-timeout=15s auth can-i "$1" "$2" -n "$3" --as="$subject" 2>/dev/null || return 1
}

[[ "$(authorize create deployments coder-customers)" == yes ]] || fail 'Dedicated provisioner cannot create customer deployments, or RBAC impersonation is unavailable.'
[[ "$(authorize create persistentvolumeclaims coder-customers)" == yes ]] || fail 'Dedicated provisioner cannot create customer PVCs, or RBAC impersonation is unavailable.'
[[ "$(authorize get secrets coder-customers)" == no ]] || fail 'Provisioner can read customer Kubernetes secrets, or RBAC impersonation is unavailable.'
if [[ "$operator_namespace_present" == true ]]; then
  for resource in deployments persistentvolumeclaims secrets; do
    [[ "$(authorize get "$resource" coder)" == no ]] || fail "Provisioner can read operator $resource or RBAC impersonation is unavailable."
  done
fi
info 'Dedicated provisioner can create customer deployments/PVCs without secret or operator namespace read access.'

kubectl --request-timeout=15s -n coder-customers get pods -o name || fail 'Cannot inspect customer pods.'
storage_classes="$(kubectl --request-timeout=15s get storageclasses -o name)" || fail 'Cannot inspect Kubernetes storage classes.'
[[ -n "$storage_classes" ]] || fail 'No Kubernetes StorageClass exists for the customer PVC.'
info 'READ-ONLY PREFLIGHT PASSED. Still requires manual AWS node/volume capacity, default StorageClass, CNI enforcement, external provisioner credentials, image digest, OIDC and independent compute hard-stop verification.'
