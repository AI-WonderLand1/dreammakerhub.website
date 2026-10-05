# AI WONDERLAND Coder IDE on Google Docker

The customer WonderSpace IDE now defaults to the verified Coder template:

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

The verified workspace includes:

- one Docker container per running Coder workspace
- one persistent Docker volume mounted at `/home/coder`
- the Coder agent
- code-server
- Git Config
- File Browser
- terminal access

The tested workspace survived stop/start with data under `/home/coder` intact.

## Workspace image

The Google template uses the AI WONDERLAND workspace image:

`ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest`

Workspace images and infrastructure settings remain operator-controlled. The browser must not supply arbitrary image URLs.

## Customer launch safety

Moving the default template to Google does **not** bypass the customer launch gates.

Customer provisioning remains disabled until the existing billing, identity, template-isolation, and hard-stop checks are explicitly verified and enabled. Keep those checks independent of Coder template availability.

## Repository launch

The current Google Docker template does not advertise repository rich parameters. The website therefore reports repository launch as unavailable unless the published Coder template exposes validated `repo_url` and `repo_branch` parameters.

Do not send shared GitHub credentials into customer workspaces.

## Legacy Railway template

`infra/coder/template/` still contains the previous Railway/GraphQL template source for rollback and historical compatibility. It is **not** the website's default customer IDE template after this migration.

Do not delete or repurpose that directory until the Google Docker template source is checked into the repository and rollback is no longer required.

## Operations

Useful checks on the Google host:

```bash
coder provisioner list --org coder
sudo systemctl status coder-google-provisioner --no-pager
docker ps
```

The Google provisioner must appear with `environment=google`, and its service process must retain access to the host Docker group.

## Security

Never commit:

- Coder session/API tokens
- Coder provisioner keys
- SSH private keys
- registry passwords or PATs

Keep customer workspace ownership and resource-budget checks server-side. A successful Coder or Docker health check alone is not sufficient to enable customer provisioning.
