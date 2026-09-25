#!/usr/bin/env bash
# Installs ONLY suspended customer API schedulers. Never creates customer pods,
# configures Coder, runs migrations, or enables billable operations.
set -euo pipefail

mode="check"
if [[ $# -gt 1 ]]; then echo "Usage: $0 [--check|--install-paused]" >&2; exit 2; fi
if [[ $# -eq 1 ]]; then mode="$1"; fi
if [[ "$mode" != "--check" && "$mode" != "--install-paused" && "$mode" != "check" ]]; then
  echo "Usage: $0 [--check|--install-paused]" >&2; exit 2
fi

: "${EXPECTED_KUBE_CONTEXT:?Set the verified Kubernetes context (for example coder-aws-repair)}"
: "${EXPECTED_CLUSTER_ARN:?Set the exact AWS EKS cluster ARN after independently verifying it}"
AWS_REGION="${AWS_REGION:-us-east-1}"
EKS_CLUSTER="${EKS_CLUSTER:-coder-cluster}"
root="$(cd -- "$(dirname -- "$0")/../.." && pwd)"
manifest="$root/infra/coder/customer-worker-cronjobs.yaml"

for cmd in aws kubectl jq sed mktemp; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing command: $cmd" >&2; exit 1; }
done
[[ -f "$manifest" ]] || { echo "CronJob manifest not found: $manifest" >&2; exit 1; }

current="$(kubectl config current-context)"
[[ "$current" == "$EXPECTED_KUBE_CONTEXT" ]] || {
  echo "BLOCKED: current context does not match EXPECTED_KUBE_CONTEXT" >&2; exit 1;
}
actual_arn="$(aws eks describe-cluster --region "$AWS_REGION" --name "$EKS_CLUSTER" --query cluster.arn --output text)"
[[ "$actual_arn" == "$EXPECTED_CLUSTER_ARN" ]] || {
  echo "BLOCKED: AWS cluster ARN mismatch. No changes made." >&2; exit 1;
}
cluster_status="$(aws eks describe-cluster --region "$AWS_REGION" --name "$EKS_CLUSTER" --query cluster.status --output text)"
[[ "$cluster_status" == "ACTIVE" ]] || {
  echo "BLOCKED: EKS cluster is not ACTIVE." >&2; exit 1;
}
aws_endpoint="$(aws eks describe-cluster --region "$AWS_REGION" --name "$EKS_CLUSTER" --query cluster.endpoint --output text)"
kube_endpoint="$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')"
[[ "$aws_endpoint" == "$kube_endpoint" ]] || {
  echo "BLOCKED: kubeconfig server differs from the verified EKS endpoint." >&2; exit 1;
}

kubectl --context "$EXPECTED_KUBE_CONTEXT" get nodes >/dev/null
kubectl --context "$EXPECTED_KUBE_CONTEXT" get namespace coder >/dev/null
kubectl --context "$EXPECTED_KUBE_CONTEXT" get namespace coder-customers >/dev/null
kubectl --context "$EXPECTED_KUBE_CONTEXT" -n coder get deployment coder >/dev/null
echo "Read-only cluster identity and namespace checks passed."
kubectl --context "$EXPECTED_KUBE_CONTEXT" -n coder get deployment coder -o jsonpath='Coder available replicas: {.status.availableReplicas}{"\n"}'
kubectl --context "$EXPECTED_KUBE_CONTEXT" get storageclass

if [[ "$mode" != "--install-paused" ]]; then
  echo "Check only. No Kubernetes resources changed."
  echo "For paused installation: set PINNED_CURL_IMAGE to reviewed curlimages/curl@sha256:<64-hex-digest>."
  exit 0
fi

[[ "${CONFIRM_INSTALL_PAUSED:-}" == "INSTALL_SUSPENDED_ONLY" ]] || {
  echo "BLOCKED: set CONFIRM_INSTALL_PAUSED=INSTALL_SUSPENDED_ONLY" >&2; exit 1;
}
[[ "${PINNED_CURL_IMAGE:-}" =~ ^curlimages/curl@sha256:[a-f0-9]{64}$ ]] || {
  echo "BLOCKED: PINNED_CURL_IMAGE must be a verified immutable curlimages/curl digest." >&2; exit 1;
}
secret="$(kubectl --context "$EXPECTED_KUBE_CONTEXT" -n coder get secret coder-customer-runner -o json)"
printf '%s' "$secret" | jq -e '.data.token | type == "string" and length > 0' >/dev/null || {
  echo "BLOCKED: private coder-customer-runner secret/token key missing" >&2; exit 1;
}
unset secret
[[ "$(grep -c 'suspend: true' "$manifest")" -eq 2 ]] || {
  echo "BLOCKED: both CronJobs must be suspended in source." >&2; exit 1;
}
[[ "$(grep -c 'REPLACE_WITH_REVIEWED_CURL_IMAGE_DIGEST' "$manifest")" -eq 2 ]] || {
  echo "BLOCKED: expected exactly two reviewed-image placeholders." >&2; exit 1;
}
temp="$(mktemp)"
chmod 600 "$temp"
trap 'rm -f "$temp"' EXIT
sed "s#REPLACE_WITH_REVIEWED_CURL_IMAGE_DIGEST#$PINNED_CURL_IMAGE#g" "$manifest" > "$temp"
kubectl --context "$EXPECTED_KUBE_CONTEXT" -n coder apply --dry-run=server -f "$temp" >/dev/null
kubectl --context "$EXPECTED_KUBE_CONTEXT" -n coder apply -f "$temp"
for name in coder-customer-usage coder-customer-runner; do
  suspended="$(kubectl --context "$EXPECTED_KUBE_CONTEXT" -n coder get cronjob "$name" -o jsonpath='{.spec.suspend}')"
  [[ "$suspended" == "true" ]] || {
    echo "ALERT: $name is not suspended. Investigate immediately." >&2; exit 1;
  }
done
echo "Installed both CronJobs SUSPENDED. No controller/runner has been launched."
echo "Do not unsuspend until production metering, identities, hard-stop and template isolation are verified."
