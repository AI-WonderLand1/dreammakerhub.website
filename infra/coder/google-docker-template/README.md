# AI WONDERLAND Google Docker Coder template

This directory is the checked-in source for the Coder template published as:

`ai-wonderland-google`

It is intentionally separate from `infra/coder/template/`, which is the legacy Railway rollback template.

## Runtime

```text
Coder
  -> external provisioner tagged environment=google
  -> Google VM Docker daemon
  -> one container per running workspace
  -> one persistent Docker volume at /home/coder
```

## Important

Keep the Terraform modules in `main.tf`. Do not copy a second `modules.tf` containing the same `code-server`, `git-config`, or `filebrowser` blocks because Terraform combines all `.tf` files in the directory.

Do not add a Docker `entrypoint` override to the `docker_container` resource. The workspace image's `/coder-entrypoint.sh` repairs volume ownership and then starts the Coder init script as the unprivileged `coder` user.

Do not mount `/var/run/docker.sock` into customer workspace containers.

## Publish

```bash
coder templates push ai-wonderland-google --provisioner-tag environment=google
```

## Verify

Inside a workspace:

```bash
whoami
echo "$HOME"
node --version
npm --version
pnpm --version
python3 --version
git --version
```

The identity must be:

```text
coder
/home/coder
```


## Shared customer organization

AI WONDERLAND customer IDEs use one shared Coder organization for the common customer policy. This is **not** a YAML organization layer inside the workspace image.

The website resolves the live organization in this order:

1. `CODER_ORG_ID` when it is a valid live organization ID.
2. `CODER_CUSTOMER_ORG_NAME` when it matches exactly one live Coder organization by name/display name.
3. Coder's one unambiguous default organization.
4. The only live organization when exactly one exists.

New verified customer OIDC users are created with:

```text
organization_ids: [resolved customer organization]
```

Recommended production setting for the current built-in organization:

```bash
CODER_CUSTOMER_ORG_NAME=Coder
```

### Where customer defaults actually live

The organization controls shared membership and Coder policy. Workspace defaults live in the published `ai-wonderland-google` template so they are actually enforced when the workspace is created:

- default machine profile: **Micro · 1 CPU / 2 GiB**
- optional approved profile: **Standard · 2 CPU / 4 GiB**
- operator-controlled workspace image
- persistent `/home/coder`
- default project folder `/home/coder/projects`
- code-server exposed through Coder's authenticated workspace app path
- resource ceilings applied by the Docker container template
- website-requested inactivity TTL remains server-controlled

Do not maintain a separate `defaults.yaml` / `customers.yaml` / `roles.yaml` bundle unless an application component actually reads and enforces it. Unused configuration files would not change Coder behavior.
