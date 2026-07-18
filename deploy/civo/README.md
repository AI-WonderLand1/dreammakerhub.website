# Civo Deployment — IDEs

This directory contains deployment scripts for all IDE and development environment components.

## Components

| Component | Port | Description |
|-----------|------|-------------|
| Coder Control Plane | 7080/8443 | Manages workspace lifecycle |
| Node IDE | 13337 | JavaScript/TypeScript development environment |
| Python IDE | 13337 | Python development environment |
| Coder Workspaces | Dynamic | Individual user workspace instances |

## DNS Configuration

Set these DNS records to point to your Civo LoadBalancer IP:

```
ide.dreammakerhub.website        -> <Civo LoadBalancer IP>
*.coder.dreammakerhub.website    -> <Civo LoadBalancer IP>
```

## Deployment

```bash
# Deploy all IDEs
./deploy/civo/deploy.sh apply

# Check status
./deploy/civo/deploy.sh status

# Delete deployment
./deploy/civo/deploy.sh delete
```

## Templates

IDE templates are located in `infra/coder/templates/`:

- `node-ide/main.tf` — Node.js/JavaScript IDE template
- `python-ide/main.tf` — Python IDE template
- `playcanvas-3d/main.tf` — PlayCanvas 3D editor template

## Secrets

Create the required secrets:

```bash
kubectl create secret generic coder-env -n coder \
  --from-literal=CODER_SESSION_TOKEN=<token> \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Prerequisites

- kubectl configured for Civo Kubernetes cluster
- OCI CLI configured for image pulls
- cert-manager installed for TLS
