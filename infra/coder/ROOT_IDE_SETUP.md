# AI WONDERLAND Coder IDE on Railway

The repository uses one Coder workspace template source:

`infra/coder/template/`

The published Coder template should be named:

`ai-wonderland-ide`

## Runtime

This template uses the Coder Registry Railway (via GraphQL) design.

For each Coder workspace it creates:

- one isolated Railway project
- one Railway service named `workspace`
- one persistent Railway volume mounted at `/home/coder`
- the Coder agent environment variables
- a pre-built workspace image
- optionally, a project-scoped Railway token for the workspace user

The master Railway account/team token is used only by the Coder provisioner and must never be exposed to the browser or workspace.

## No Kubernetes requirement

This workspace path does not use Kubernetes, vCluster, Envbox, Pods, PVCs, kubeconfig, or `kubectl`.

Coder provisions workspaces directly through Railway's GraphQL API.

## Required template variable

Set the Railway account/team API token when publishing:

```hcl
railway_token = "<Railway account/team token>"
```

Do not commit the real token.

Optional operator variables include:

- `enable_project_management`
- `workspace_image`
- `image_registry_username`
- `image_registry_password`

The default public workspace image is:

`ghcr.io/bpmct/railway-coder-workspace:latest`

## End-user parameter

The only end-user rich parameter exposed by this template is `region`.

Current choices are:

- US West
- US East
- Europe West
- Asia Southeast

CPU, memory, image credentials, Railway project creation, service creation, and volume creation are not accepted from the browser.

## Lifecycle

Persistent across stop/start:

- Railway project
- Railway service
- Railway volume
- optional project-scoped Railway token

Created only while the workspace is running:

- Coder agent environment variables
- image deployment

Stopping a Coder workspace cancels its running Railway deployment while preserving the project and volume.

## Publish

From an authenticated Coder CLI:

```bash
coder templates push ai-wonderland-ide \
  --directory infra/coder/template \
  --variable railway_token="$RAILWAY_TOKEN"
```

To let a workspace user manage only their own Railway project:

```bash
coder templates push ai-wonderland-ide \
  --directory infra/coder/template \
  --variable railway_token="$RAILWAY_TOKEN" \
  --variable enable_project_management=true
```

The website can override the template name with `CODER_IDE_TEMPLATE_NAME`; otherwise it expects `ai-wonderland-ide`.

## Security

Never commit:

- Railway account/team tokens
- project-scoped Railway tokens
- private registry passwords
- Coder session/API tokens

The Railway template creates project-scoped tokens only when explicitly enabled. The master Railway token is not passed into the workspace.
