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
