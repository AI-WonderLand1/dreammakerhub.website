# LightningAI Deployment — 3D Software

This directory contains deployment scripts for all 3D software components.

## Components

| Component | Port | Description |
|-----------|------|-------------|
| PlayCanvas Engine | 31000 | 3D editor with orbit controls, lighting, scene management |
| WebGLStudio Engine | 31001 | Custom WebGL shader editor and renderer |
| WonderRuntime | 3090 | 3D runtime environment for user projects |

## DNS Configuration

Set these DNS records to point to your LightningAI ingress IP:

```
play.dreammakerhub.website      -> <LightningAI ingress IP>
wonderplay.dreammakerhub.website -> <LightningAI ingress IP>
playcanvas.dreammakerhub.website -> <LightningAI ingress IP>
```

## Deployment

```bash
# Deploy all 3D software
./deploy/lightningai/deploy.sh apply

# Check status
./deploy/lightningai/deploy.sh status

# Delete deployment
./deploy/lightningai/deploy.sh delete
```

## Integration with AWS

The main website's nginx reverse-proxies 3D engine paths to LightningAI:

- `/webglstudio/` -> LightningAI WebGLStudio
- `/playcanvas/` -> LightningAI PlayCanvas

Set `LIGHTNING_3D_URL` when running AWS deployment:

```bash
LIGHTNING_3D_URL=https://<lightning-ingress> ./deploy/aws/deploy.sh
```

## Prerequisites

- kubectl configured for LightningAI cluster
- Docker images built and pushed to LightningAI registry
- LightningAI ingress configured with TLS
