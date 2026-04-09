# Wonderland IDE - OCI Kubernetes Deployment

## Quick Start

### 1. Get OKE Access
```bash
# Download kubeconfig from OCI Console
# OCI → Kubernetes Engine → Your Cluster → Access → Download kubeconfig
export KUBECONFIG=~/path/to/kubeconfig

# Test connection
kubectl get nodes
```

### 2. Deploy IDE
```bash
# Update image in deploy/k8s/ide-deployment.yaml first
# Then:
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/ide-deployment.yaml
```

### 3. Get Endpoint
```bash
# Get LoadBalancer IP
kubectl get svc wonderland-ide -n wonderland

# Or run the connection script
./connect-oci.sh
```

## What's Deployed

| Resource | Type | Purpose |
|----------|------|---------|
| `wonderland` | Namespace | Isolated environment |
| `wonderland-ide` | Deployment | code-server container |
| `wonderland-ide` | Service | LoadBalancer (OCI OKE) |
| `wonderland-ide-pvc` | PVC | 10GB persistent storage |

## Architecture

```
┌─────────────────────────────────────┐
│         OCI Load Balancer           │
│         (public IP: 8080)           │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│         wonderland-ide              │
│   ┌─────────────────────────────┐   │
│   │  code-server (port 8080)    │   │
│   │  VS Code in browser         │   │
│   └─────────────────────────────┘   │
│              │                       │
│   ┌─────────▼─────────┐             │
│   │  PVC: 10GB        │             │
│   │  /home/coder/project            │
│   └───────────────────┘             │
└─────────────────────────────────────┘
```

## Environment Variables

Set in deployment:
- `PORT=8080` — code-server port
- `WS_DIR=/home/coder/project` — workspace directory
- `CODER_ACCESS_URL` — IDE URL for users

## Scaling

To increase replicas (for multiple users):
```bash
kubectl scale deployment wonderland-ide --replicas=3 -n wonderland
```

Each replica gets its own PVC — consider using a shared storage solution (NFS, OCI File Storage) for multi-user.

## Cleanup

```bash
kubectl delete -f deploy/k8s/ide-deployment.yaml
kubectl delete namespace wonderland
```

## Troubleshooting

```bash
# Check pod status
kubectl get pods -n wonderland

# View logs
kubectl logs -n wonderland -l app=wonderland-ide

# Debug
kubectl describe pod -n wonderland -l app=wonderland-ide
```