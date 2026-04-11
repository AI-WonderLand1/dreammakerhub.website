# Wonderland Private IDE - Coder on OKE

Private, isolated IDE workspaces for each user using Coder control plane on Oracle Kubernetes Engine (OKE).

## Architecture

```
User → Coder Server (auth) → Terraform Template → K8s Pod (per-user workspace)
                          ↓
                    OCIR Cache (faster builds)
```

## Quick Start

### 1. Prerequisites

- OKE cluster running
- OCIR (Oracle Container Registry) access
- Coder server deployed in OKE
- `kubectl` configured for your cluster

### 2. Set Up OCIR Credentials

```bash
# Create namespace for workspaces
kubectl create namespace wonderland-workspaces

# Create docker registry secret for OCIR
kubectl create secret docker-registry ocir-cred \
  --namespace=wonderland-workspaces \
  --docker-server=iad.ocir.io \
  --docker-username='your-tenancy/your-username' \
  --docker-password='your-auth-token' \
  --docker-email='your-email@example.com'
```

### 3. Configure Coder Template

Copy and edit the variables file:

```bash
cd kubernetes-devcontainer
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 4. Upload Template to Coder

```bash
# Login to Coder
coder login https://coder.yourdomain.com

# Create template
coder templates create \
  --name wonderland-ide \
  --display-name "Wonderland Private IDE" \
  --description "Private IDE workspace on OKE" \
  --directory .
```

### 5. Create Workspaces

Users can now create workspaces:
1. Log into Coder
2. Click "New Workspace"
3. Select "Wonderland Private IDE"
4. Configure CPU/RAM/storage
5. Start coding!

## How It Works

### User Isolation
- **One pod per user**: Each workspace is a separate K8s deployment
- **Persistent storage**: PVC at `/workspaces` stores user files
- **Resource limits**: Each workspace has configurable CPU/RAM limits
- **Network isolation**: Workspaces run in isolated network namespace

### Build Process
Two options available:

#### Option A: Envbuilder (Devcontainer)
- Coder pulls user's repo
- Envbuilder builds from `.devcontainer/devcontainer.json`
- Automatic dependency installation
- Cache layers in OCIR for faster rebuilds

> ⚠️ Important: the Terraform template in this directory currently deploys a prebuilt container image. It does **not** invoke Envbuilder by itself.

#### Option B: Prebuilt Image
- Build `Dockerfile.workspace` once
- Push to OCIR
- Workspace starts instantly from cached image

### Access
- **IDE**: Via Coder's built-in proxy (no public LoadBalancer per workspace)
- **Port forwarding**: Additional ports auto-discovered from devcontainer.json
- **SSH**: Optional via Coder's SSH feature

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CODER_URL` | Coder server URL | Required |
| `OCI_REGISTRY` | OCIR registry URL | Required |
| `CACHE_REPO` | Cache repository URL | Optional |
| `NAMESPACE` | K8s namespace | `wonderland-workspaces` |

### Workspace Parameters

Users can configure:
- **CPU**: 1-8 cores
- **Memory**: 1-32 GiB
- **Storage**: 5-100 GiB
- **Repository**: Git repo to clone
- **Dotfiles**: Personal dotfiles repo

## Codespaces-Like Features

### Auto-Setup (post-create.sh)
- Automatically installs dependencies from `package.json`, `requirements.txt`, etc.
- Sets up git configuration
- Runs custom setup scripts

### Auto-Start (optional)
Set `AUTO_START=true` to automatically start dev server on workspace start.

### Dotfiles Support
Users can specify a dotfiles repo URL - automatically installed on first start.

## Cache & Performance

### Registry Caching
Configure `cache_repo` to use OCIR as a build cache:

```hcl
cache_repo = "iad.ocir.io/tenancy/wonderspace/cache"
```

Envbuilder will:
1. Check cache for prebuilt layers
2. Reuse cached layers if available
3. Push new layers to cache for future builds

### Prebuilds (Advanced)
For even faster startup, create GitHub Actions workflow to prebuild images:

```yaml
# .github/workflows/prebuild.yml
name: Prebuild Workspace Image
on:
  push:
    branches: [main]
jobs:
  prebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker build -f .devcontainer/Dockerfile -t $OCI_REGISTRY/workspace:latest .
          docker push $OCI_REGISTRY/workspace:latest
```

## Security

- **Authentication**: Handled by Coder (GitHub OAuth)
- **Authorization**: Users can only access their own workspaces
- **Network**: Workspaces not exposed publicly (accessed via Coder proxy)
- **Storage**: PVCs are per-workspace, isolated
- **Secrets**: OCIR credentials stored in K8s secrets

## Troubleshooting

### Workspace Won't Start
```bash
# Check pod status
kubectl get pods -n wonderland-workspaces

# View logs
kubectl logs -n wonderland-workspaces deployment/coder-<workspace-id>

# Describe deployment
kubectl describe deployment -n wonderland-workspaces coder-<workspace-id>
```

### Build Cache Issues
```bash
# Clear cache (if using cache_repo)
kubectl delete deployment -n wonderland-workspaces coder-<workspace-id>
# Then recreate workspace
```

### Image Pull / "Build" Fails Immediately
If workspace creation fails right away, verify these first:

```bash
# Confirm the deployment is trying to use the expected image
kubectl get deployment -n wonderland-workspaces coder-<workspace-id> -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'

# Confirm image pull secret is attached to the pod spec
kubectl get deployment -n wonderland-workspaces coder-<workspace-id> -o jsonpath='{.spec.template.spec.imagePullSecrets[*].name}{"\n"}'

# Inspect pull failures
kubectl describe pod -n wonderland-workspaces <pod-name> | sed -n '/Events:/,$p'
```

Common causes:
- The image path is wrong or tag does not exist in OCIR.
- The `ocir-cred` secret is missing from `wonderland-workspaces`.
- OCIR credentials are valid but missing permissions for the target repo.

### `http://localhost` Kubernetes API Error
If Terraform shows `Post "http://localhost/api/v1/...": connect: connection refused`, the template likely ran without a usable Kubernetes host/token value.

Verify:
```bash
# Confirm template variables include a real API host (or leave empty to use in-cluster default)
grep -n "k8s_host\\|k8s_token" terraform.tfvars

# Re-upload template after Terraform edits
coder templates create --name wonderland-ide --directory .
```

### Permission Issues
Ensure service account has proper RBAC:
```bash
kubectl create clusterrolebinding coder-workspace-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=wonderland-workspaces:coder-workspace
```

## Migration from Docker

If you're currently using Docker-based workspaces:

1. Export user workspaces data from Docker volumes
2. Set up Coder server in OKE
3. Import this template
4. Users create new workspaces in Coder
5. Copy data from old Docker volumes to new PVCs

## Cost Optimization

- **Idle timeout**: Configure Coder to auto-stop idle workspaces
- **Resource quotas**: Set namespace quotas to limit total resources
- **Spot instances**: Use OCI preemptible instances for dev workloads

## Next Steps

- [ ] Set up Coder server in OKE
- [ ] Configure GitHub OAuth
- [ ] Upload this template
- [ ] Test workspace creation
- [ ] Configure registry caching
- [ ] Set up monitoring

## Support

For issues or questions:
- Coder docs: https://coder.com/docs
- Envbuilder: https://github.com/coder/envbuilder
- OKE docs: https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
