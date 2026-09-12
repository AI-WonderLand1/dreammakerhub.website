#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NAMESPACE="coder"

echo "== DreamMakerHub UpCloud Kubernetes deploy =="
echo "Context: $(kubectl config current-context)"
kubectl cluster-info >/dev/null

kubectl apply -f "$REPO_ROOT/deploy/k8s/namespace.yaml"

if ! kubectl get ingressclass nginx >/dev/null 2>&1; then
  cat >&2 <<'EOF'
ERROR: ingress class "nginx" is not installed.

Run the UpCloud bootstrap first:
  ./deploy/upcloud/bootstrap-k8s.sh
EOF
  exit 1
fi

if ! kubectl get crd certificates.cert-manager.io >/dev/null 2>&1; then
  cat >&2 <<'EOF'
ERROR: cert-manager is not installed.

Run the UpCloud bootstrap first:
  ./deploy/upcloud/bootstrap-k8s.sh
EOF
  exit 1
fi

missing=0
for secret in coder-env oci-registry-secret; do
  if ! kubectl get secret "$secret" -n "$NAMESPACE" >/dev/null 2>&1; then
    echo "ERROR: missing secret $NAMESPACE/$secret" >&2
    missing=1
  fi
done

if ! kubectl get secret cloudflare-api-token-secret -n cert-manager >/dev/null 2>&1; then
  echo "ERROR: missing secret cert-manager/cloudflare-api-token-secret" >&2
  missing=1
fi

if [ "$missing" -ne 0 ]; then
  cat >&2 <<'EOF'

Required secret keys:
  coder/coder-env:
    CODER_DB_PASSWORD
    CODER_SESSION_TOKEN

  coder/oci-registry-secret:
    Docker registry credentials able to pull from OCIR.

  cert-manager/cloudflare-api-token-secret:
    api-token

Create these from your real credentials; do not commit them to GitHub.
EOF
  exit 1
fi

kubectl apply -f "$REPO_ROOT/deploy/k8s/configmap.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/coder-rbac.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/coder-db.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/coder-deployment.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/ide-deployment.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/cluster-issuer.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/web-deployment.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/ingress.yaml"
kubectl apply -f "$REPO_ROOT/deploy/k8s/workspace-ingress.yaml"

echo "== Verifying Coder can provision workspace pods =="
for permission in \
  "create deployments.apps" \
  "delete deployments.apps" \
  "create persistentvolumeclaims" \
  "delete persistentvolumeclaims"; do
  verb="${permission%% *}"
  resource="${permission#* }"
  if [ "$(kubectl auth can-i \
    --as=system:serviceaccount:coder:coder-workspace-provisioner \
    "$verb" "$resource" -n "$NAMESPACE")" != "yes" ]; then
    echo "ERROR: Coder service account cannot $verb $resource in $NAMESPACE" >&2
    exit 1
  fi
done

echo "== Waiting for rollouts =="
kubectl rollout status deployment/coder-db -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/coder -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/coder-ide -n "$NAMESPACE" --timeout=180s
kubectl rollout status deployment/dreammaker-web -n "$NAMESPACE" --timeout=300s

echo "== Waiting for Coder TLS certificates =="
kubectl wait --for=condition=Ready certificate/coder-tls \
  -n "$NAMESPACE" --timeout=300s
kubectl wait --for=condition=Ready certificate/coder-workspace-tls \
  -n "$NAMESPACE" --timeout=300s

echo "== Verifying public Coder API =="
coder_status="$(curl --silent --show-error --output /dev/null \
  --write-out '%{http_code}' --max-time 20 \
  https://coder.dreammakerhub.website/api/v2/buildinfo || true)"
if [ "$coder_status" != "200" ]; then
  echo "ERROR: Coder API returned HTTP $coder_status (expected 200)" >&2
  echo "Inspect with:" >&2
  echo "  kubectl describe certificate coder-tls -n $NAMESPACE" >&2
  echo "  kubectl logs deployment/coder -n $NAMESPACE --tail=200" >&2
  exit 1
fi

echo "== Current public routing state =="
kubectl get pods,svc,ingress -n "$NAMESPACE" -o wide
kubectl get certificate -n "$NAMESPACE" 2>/dev/null || true
kubectl get svc -n ingress-nginx ingress-nginx-controller 2>/dev/null || true
