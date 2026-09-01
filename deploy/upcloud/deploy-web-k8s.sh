#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NAMESPACE="coder"

echo "== DreamMakerHub web-only deploy =="
echo "Context: $(kubectl config current-context)"
kubectl cluster-info >/dev/null

kubectl apply -f "$REPO_ROOT/deploy/k8s/namespace.yaml"

if ! kubectl get ingressclass nginx >/dev/null 2>&1; then
  echo "ERROR: nginx ingress is not installed. Run: bash deploy/upcloud/bootstrap-k8s.sh" >&2
  exit 1
fi

if ! kubectl get crd certificates.cert-manager.io >/dev/null 2>&1; then
  echo "ERROR: cert-manager is not installed. Run: bash deploy/upcloud/bootstrap-k8s.sh" >&2
  exit 1
fi

if ! kubectl get secret cloudflare-api-token-secret -n cert-manager >/dev/null 2>&1; then
  echo "ERROR: missing cert-manager/cloudflare-api-token-secret with key api-token" >&2
  exit 1
fi

kubectl apply -f "$REPO_ROOT/deploy/k8s/cluster-issuer.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/web-deployment.yaml"

kubectl rollout status deployment/dreammaker-web -n "$NAMESPACE" --timeout=300s

echo "== Web routing state =="
kubectl get pod,svc,ingress -n "$NAMESPACE" -o wide
kubectl get certificate -n "$NAMESPACE" 2>/dev/null || true
kubectl get svc -n ingress-nginx ingress-nginx-controller -o wide
