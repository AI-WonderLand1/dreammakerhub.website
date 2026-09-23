#!/usr/bin/env bash
# READ ONLY. Inspect the actual AWS Kubernetes context before any customer pod
# rollout. This script never applies YAML, creates pods or prints credentials.
set -euo pipefail

fail() { printf 'BLOCKED: %s\n' "$*" >&2; exit 1; }
info() { printf 'CHECK: %s\n' "$*"; }

command -v kubectl >/dev/null 2>&1 || fail 'kubectl is not installed on this AWS host; a Docker web VM is not an established Kubernetes cluster.'
[[ -n "${EXPECTED_KUBE_CONTEXT:-}" ]] || fail 'Set the verified AWS_CODER_KUBE_CONTEXT GitHub variable first. Refusing an unknown cluster.'

actual_context="$(kubectl config current-context 2>/dev/null)" || fail 'No usable kubeconfig/current context on this AWS host.'
[[ "$actual_context" == "$EXPECTED_KUBE_CONTEXT" ]] || fail "Kubernetes context does not match verified AWS_CODER_KUBE_CONTEXT (actual: $actual_context)."
info "Verified expected Kubernetes context: $actual_context"

kubectl --request-timeout=15s get nodes -o name >/dev/null || fail 'Cannot read AWS Kubernetes nodes with the current credentials.'
kubectl --request-timeout=15s get namespace coder -o name >/dev/null || fail 'Coder control-plane namespace is not available in this cluster.'
kubectl --request-timeout=15s get namespace coder-customers -o name >/dev/null || fail 'Separate coder-customers namespace has not been installed.'
info 'Coder and customer namespaces exist; no namespace was created.'

for object in \
  'resourcequota/customer-pilot-cap' \
  'networkpolicy/customer-default-deny' \
  'networkpolicy/customer-dns' \
  'networkpolicy/customer-public-https' \
  'serviceaccount/coder-customer-provisioner' \
  'role/coder-customer-provisioner' \
  'rolebinding/coder-customer-provisioner'; do
  kubectl --request-timeout=15s -n coder-customers get "$object" -o name >/dev/null || fail "Missing customer-only Kubernetes resource: $object"
done
info 'Customer quota, policies and dedicated provisioner RBAC objects exist.'

subject='system:serviceaccount:coder-customers:coder-customer-provisioner'
authorize() {
  # A missing impersonation privilege is inconclusive and must not be treated
  # as a successful denial. Keep rollout blocked in that case.
  kubectl --request-timeout=15s auth can-i "$1" "$2" -n "$3" --as="$subject" 2>/dev/null || return 1
}

[[ "$(authorize create deployments coder-customers)" == yes ]] || fail 'Dedicated provisioner cannot create customer deployments, or RBAC impersonation is unavailable.'
[[ "$(authorize create persistentvolumeclaims coder-customers)" == yes ]] || fail 'Dedicated provisioner cannot create customer PVCs, or RBAC impersonation is unavailable.'
for target in 'deployments coder' 'persistentvolumeclaims coder' 'secrets coder' 'secrets coder-customers'; do
  read -r resource namespace <<< "$target"
  [[ "$(authorize get "$resource" "$namespace")" == no ]] || fail "Provisioner has access to $resource in $namespace, or RBAC impersonation is unavailable."
done
info 'Provisioner can create customer deployments/PVCs and cannot read operator resources or Kubernetes secrets.'

kubectl --request-timeout=15s -n coder-customers get pods -o name || fail 'Cannot inspect customer pods.'
kubectl --request-timeout=15s get storageclasses -o name || fail 'Cannot inspect Kubernetes storage classes.'
info 'READ-ONLY PREFLIGHT PASSED. Still requires manual AWS node/volume capacity, default StorageClass, CNI enforcement, external provisioner credentials, image digest, OIDC and independent compute hard-stop verification.'
