#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

command -v kubectl >/dev/null || { echo "kubectl is required" >&2; exit 1; }
command -v helm >/dev/null || { echo "helm is required" >&2; exit 1; }

echo "== Cluster context =="
kubectl config current-context
kubectl get nodes

echo "== Install/upgrade ingress-nginx for UpCloud =="
helm upgrade --install ingress-nginx ingress-nginx   --repo https://kubernetes.github.io/ingress-nginx   --namespace ingress-nginx   --create-namespace   --values "$REPO_ROOT/deploy/upcloud/ingress-nginx-values.yaml"

kubectl rollout status deployment/ingress-nginx-controller   -n ingress-nginx --timeout=300s

echo "== Install/upgrade cert-manager =="
helm repo add jetstack https://charts.jetstack.io --force-update >/dev/null
helm repo update >/dev/null
helm upgrade --install cert-manager jetstack/cert-manager   --namespace cert-manager   --create-namespace   --set crds.enabled=true

kubectl rollout status deployment/cert-manager   -n cert-manager --timeout=300s
kubectl rollout status deployment/cert-manager-webhook   -n cert-manager --timeout=300s

echo "== Bootstrap complete =="
kubectl get ingressclass
kubectl get svc -n ingress-nginx ingress-nginx-controller -o wide
kubectl get pods -n cert-manager
