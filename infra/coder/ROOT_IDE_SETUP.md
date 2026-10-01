# AI WONDERLAND Coder IDE

The repository now uses one Coder workspace template source:

`infra/coder/template/`

The published Coder template should be named:

`ai-wonderland-ide`

## Runtime

The template creates one Kubernetes Pod per running Coder workspace and keeps the user's home directory on a persistent volume claim.

The workspace uses Envbox with nested Docker support, code-server, the Coder agent, and optional JetBrains integration.

## vCluster / Kubernetes connection

When Coder runs outside the workspace Kubernetes cluster or vCluster, publish the template with `use_kubeconfig=true` and mount a valid kubeconfig on the Coder provisioner host.

When Coder runs inside the same cluster and is authenticated through its Kubernetes service account, use `use_kubeconfig=false`.

Do not commit kubeconfig files, service-account tokens, Coder API tokens, or cluster-admin credentials to this repository.

## Namespace

The template defaults to `coder-workspaces`. The namespace must exist and the Coder provisioner identity must be allowed to create Pods and PVCs there.

## Resource defaults

The current customer guardrails are:

- CPU: 1 or 2 cores
- Memory: 1, 2, or 4 GiB
- Persistent home disk: 10 GiB
- Workspace restart policy: Never

Stopping a Coder workspace removes the running Pod while the PVC remains for the next start.

## Publish

From an authenticated Coder CLI:

```bash
coder templates push ai-wonderland-ide \
  --directory infra/coder/template
```

Or import the same Terraform files through the Coder Templates UI.

The website can override the template name with `CODER_IDE_TEMPLATE_NAME`; otherwise it looks for `ai-wonderland-ide`.

## Security warning

This Envbox template currently uses a privileged container plus host `/usr/src` and `/lib/modules` mounts to provide nested Docker functionality. That is materially more privileged than a normal Envbuilder workspace. Before opening customer access, verify that the host Kubernetes/vCluster environment explicitly supports this model and that customer workspaces cannot reach host or cluster credentials.
