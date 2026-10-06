# AI WONDERLAND Coder IDE on Google Docker

The customer WonderSpace IDE defaults to the verified Coder template:

`ai-wonderland-google`

The website may override that template with `CODER_IDE_TEMPLATE_NAME`, but when no override is set it must resolve `ai-wonderland-google`.

## Verified runtime

The production path is:

```text
coder.dreammakerhub.website
        ↓
external Coder provisioner tagged environment=google
        ↓
Google Compute Engine host
        ↓
Docker workspace container
        ↓
persistent /home/coder Docker volume
```

The external provisioner runs as a persistent system service on the Google host and must be able to access the Docker socket. The published template is restricted to the `environment=google` provisioner tag so Docker resources are created on that host rather than by the built-in provisioners.

## Source of truth

The checked-in Google Docker template is:

`infra/coder/google-docker-template/main.tf`

The workspace image is built from:

`infra/coder/workspace-image/`

and published as:

`ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest`

The Google Docker template intentionally does **not** override the image `ENTRYPOINT`. The image entrypoint starts as root only long enough to repair ownership on a newly-created persistent Docker volume, then launches the Coder init script as the unprivileged `coder` user.

## Workspace contents

Each running workspace includes:

- one isolated Docker container
- one persistent Docker volume mounted at `/home/coder`
- Coder agent
- code-server
- Git Config
- File Browser
- terminal access
- Node.js 22
- npm and pnpm
- TypeScript
- Python
- Git and common build tools

Files under `/home/coder` are intended to survive workspace stop/start.

## Publish

Publish the checked-in Google template from the directory containing `main.tf` and route it only to the Google external provisioner:

```bash
cd infra/coder/google-docker-template
coder templates push ai-wonderland-google --provisioner-tag environment=google
```

Before publishing, confirm the Google provisioner is healthy:

```bash
coder provisioner list --org coder
sudo systemctl status coder-google-provisioner --no-pager
docker ps
```

## Runtime verification

A correctly launched workspace should report:

```bash
whoami
echo "$HOME"
node --version
npm --version
pnpm --version
python3 --version
git --version
```

Expected identity:

```text
coder
/home/coder
```

Do not accept `root` / `/root` for customer workspaces.

For persistence testing:

```bash
echo "AI WONDERLAND persistence works" > /home/coder/persistence-test.txt
cat /home/coder/persistence-test.txt
```

Stop and start the **same** workspace, then verify the file still exists.

## Legacy Railway rollback source

`infra/coder/template/` remains the previous Railway/GraphQL template for rollback and historical compatibility. It is not the default Google Docker template and should not be published as `ai-wonderland-google`.

Do not mix files from the Railway template and Google Docker template in the same Coder template directory. Terraform loads every `.tf` file in a directory as one configuration, so duplicate module declarations will fail initialization.

## Customer launch safety

A working Docker template does **not** bypass customer launch gates.

Keep billing, entitlement, ownership, workspace-count, cost, and customer-isolation checks server-side. A successful Coder or Docker health check alone is not sufficient to enable unrestricted customer provisioning.

## Security

Never commit:

- Coder session/API tokens
- Coder provisioner keys
- SSH private keys
- registry passwords or PATs

Never mount the host Docker socket inside customer workspace containers.
