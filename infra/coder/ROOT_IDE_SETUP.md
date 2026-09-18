# DreamMakerHub root Coder IDE: operator checklist

This is the **real Coder/Kubernetes IDE** (`infra/coder/template/main.tf` and `repository.tf`). Do not publish the unrelated browser-only IDE from `apps/` or the older `infra/coder/templates/node-ide` and `python-ide` files in its place. Those older files do not define a workspace Kubernetes pod.

## 1. Confirm the real Coder deployment is reachable

Coder is self-hosted by the operator; logging into coder.com does **not** automatically deploy or configure our server. The repository expects the Coder control plane at `https://coder.dreammakerhub.website` and its workspace app wildcard at `*.coder.dreammakerhub.website` (`deploy/k8s/configmap.yaml`). The published Coder template is normally named `wonderspace-ide` (or the server-only `CODER_IDE_TEMPLATE_NAME` setting).

From a machine with the **correct** Kubernetes context, run:

```bash
kubectl config current-context
kubectl get deployments,pods,svc,ingress -n coder
kubectl get certificate -n coder
kubectl get svc -n ingress-nginx ingress-nginx-controller -o wide
curl --fail --show-error --max-time 15 https://coder.dreammakerhub.website/api/v2/buildinfo
```

Check that both `coder-tls` and `coder-workspace-tls` certificates are Ready **before** enabling the revised template. In Cloudflare DNS, `coder` and `*.coder` must resolve to the actual ingress endpoint; the wildcard needs a valid origin certificate. A Cloudflare 526 is an origin TLS problem, not a Terraform/template error. The `letsencrypt-prod` issuer uses a Cloudflare DNS-01 token stored as `cert-manager/cloudflare-api-token-secret`; do not put it in the repository. See `deploy/upcloud/deploy-k8s.sh`. Do not point DNS at an unverified old VM IP.

The root template's `coder_app` now uses `subdomain = true`: its VS Code application and forwarded ports need the wildcard certificate, not just a certificate for the dashboard hostname. This also isolates editor content from the Coder dashboard origin. If the wildcard certificate is missing, **do not publish this template version yet**.

## 2. Publish the actual source template in your Coder dashboard

After the Coder URL loads, sign in to **your Coder deployment** with a template-admin account. Go to **Templates**, find `wonderspace-ide`, and publish the files from `infra/coder/template/` (both `main.tf` and `repository.tf`, not only one). From a trusted terminal at the repository root, the equivalent command is:

```bash
coder login https://coder.dreammakerhub.website
coder templates push wonderspace-ide --directory infra/coder/template
coder templates list
```

If the deployment uses `kubernetes-mvp` instead, publish that **existing** template name and configure `CODER_IDE_TEMPLATE_NAME=kubernetes-mvp` in the running DreamMakerHub web service. The web app reads the published *active* template version, not the GitHub working tree. Do not blindly create a second similarly named template.

Confirm Coder's active template exposes selectable `cpu` and `memory`, plus `home_disk_size`, `ssh_public_key`, `repo_url` and `repo_branch`. Public GitHub repository selection in WonderSpace will remain unavailable until the active template contains the latter two parameters. This version does **not** support private-repository cloning.

## 3. Connect the deployed DreamMakerHub backend, not the browser

The server uses `CODER_API_URL`, `CODER_ACCESS_URL` and `CODER_API_TOKEN`. `CODER_ACCESS_URL` is the public HTTPS dashboard URL; `CODER_API_URL` must be reachable from the *running web server* (an internal service URL is possible if web and Coder really share the cluster). Use a dedicated, revocable Coder API token with the minimum permissions required. The Coder dashboard exposes tokens under **Account Settings → Tokens** (`/settings/tokens`). Never put this token in `NEXT_PUBLIC_*`, client code, a public GitHub variable, screenshots or chat.

For the **root Kubernetes deployment** use the existing `coder/dreammaker-web-env` Kubernetes Secret and `deploy/upcloud/deploy-k8s.sh`, which validate these three keys without printing their values. If the main site is actually running in **UpCloud Docker**, update its GitHub Actions *secret* `CODER_API_TOKEN` and `CODER_API_URL`/`CODER_ACCESS_URL` configuration in that site's actual deployment path instead. Changing a Kubernetes Secret will not configure a separate Docker container. Inspect the running deployment before changing any credential.

## 4. Smoke-test in Coder and on DreamMakerHub

Create a single test workspace from the published template in Coder. Confirm its Coder agent is connected, VS Code opens on its app subdomain over HTTPS, terminal works, `git status` shows the selected public repository, and a forwarded development port loads over HTTPS. Next, launch one workspace from DreamMakerHub's `/wonderspace` and check that the *same* Coder workspace and editor open. Stop the test workspace when finished to avoid cluster costs.

**Multi-user access limitation:** DreamMakerHub's current `CoderAPIWrapper.createWorkspace()` uses a server token with `CODER_WORKSPACE_OWNER` (default `me`), not a distinct authenticated Coder identity for every DreamMakerHub user. A browser user who is not authenticated as that Coder owner may be denied the owner-only IDE app. Do **not** remove Coder app authentication, share the server token with users, or enable anonymous access to work around this. Implement/test a real user-identity mapping or an authorized Coder access flow before recruiting public beta testers for the IDE. This PR does not claim that multi-tenant login is fixed.

**Windows limitation:** This Terraform template creates Linux `amd64` pods. A genuine Windows workspace requires a separately provisioned Windows-capable compute backend and a Windows Coder template; changing the OS label on a Linux pod does not create Windows. No Windows capacity is deployed by this change.

## Rollback and scope

This patch changes only the source Coder template and operator documentation. It does not publish the template, modify DNS/certificates/tokens, restart a Coder pod or deploy the website. If an activated template version breaks workspace access, reactivate the previous Coder template version and update affected workspaces after verifying its persistence. Do not delete PVCs or the shared Coder database.
