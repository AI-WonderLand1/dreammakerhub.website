# ============================================================================
# Railway (via GraphQL) — Coder Template
# ============================================================================
#
# Each Coder workspace becomes a fully isolated Railway project running
# a container built from a pre-built image on GHCR. Every Railway
# operation is a direct GraphQL mutation via `curl` (no community
# Railway Terraform provider).
#
# See registry/bpmct/templates/railway/README.md for the full write-up
# on why this template calls the Railway API directly instead of using
# the community provider, and https://github.com/bpmct/coder-railway
# for three alternative approaches (tf-patched, hybrid, cli) and the
# reliability suite behind the design choices.
#
# Image contract:
#   The workspace image's ENTRYPOINT must consume:
#     CODER_INIT_SCRIPT_B64   base64-encoded Coder agent init script
#     CODER_AGENT_TOKEN       Coder agent token
#     RAILWAY_RUN_UID         "0" so the entrypoint can chown the
#                             root-owned Railway volume mount and then
#                             drop to the coder user.
#   The default image (ghcr.io/bpmct/railway-coder-workspace:latest) is
#   codercom/enterprise-base:ubuntu plus a small entrypoint. Source at
#   https://github.com/bpmct/coder-railway/tree/main/build.
#
# Lifecycle:
#   Persistent (survive stop): project, service, volume, project token
#   Ephemeral  (start_count):  env vars, image deploy
#
# Provisioner layout:
#   Bash bodies live in scripts/*.sh, one file per (resource, action).
#   main.tf only wires `command = "bash ${path.module}/scripts/X.sh"`
#   and passes runtime values via environment {} blocks. Destroy
#   provisioners reference self.input.* because vars/locals/data are
#   not allowed in destroy scopes. ${path.module} is a constant and
#   safe to use everywhere.
# ============================================================================

terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
  }
}

variable "railway_token" {
  type        = string
  description = "Railway API token."
  sensitive   = true
}

variable "enable_project_management" {
  type        = bool
  default     = false
  description = <<-EOT
    If true, provision a project-scoped Railway token in each workspace's
    Railway project and install the Railway CLI in the workspace. The
    workspace user can then run `railway logs`, `railway up`,
    `railway run`, etc. against their own project. The master token
    (var.railway_token) is never exposed to the workspace; only the
    project-scoped token is.
  EOT
}

variable "workspace_image" {
  type        = string
  default     = "ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest"
  description = <<-EOT
    Pre-built workspace image. The image's ENTRYPOINT must consume the
    CODER_INIT_SCRIPT_B64, CODER_AGENT_TOKEN, and RAILWAY_RUN_UID env
    vars. The default image is built from infra/coder/workspace-image in this repository
    and published to GHCR by .github/workflows/coder-workspace-image.yml.
  EOT
}

variable "image_registry_username" {
  type        = string
  default     = ""
  description = <<-EOT
    Optional registry username for private image pulls. Leave empty
    when pointing at the public default image
    (ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace) or any other public
    registry.
  EOT
}

variable "image_registry_password" {
  type        = string
  default     = ""
  sensitive   = true
  description = <<-EOT
    Optional registry password / PAT for private image pulls. Leave
    empty when pointing at the public default image
    (ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace) or any other public
    registry.
  EOT
}

provider "coder" {}

locals {
  username     = data.coder_workspace_owner.me.name
  workspace    = lower(data.coder_workspace.me.name)
  started      = data.coder_workspace.me.start_count > 0
  railway_api  = "https://backboard.railway.com/graphql/v2"
  state_dir    = "${path.module}/.railway-state"
  scripts_dir  = "${path.module}/scripts"
  project_name = lower(substr("coder-${local.username}-${local.workspace}", 0, 32))
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

data "coder_parameter" "repo_url" {
  name         = "repo_url"
  display_name = "GitHub Repository"
  description  = "Optional public GitHub repository in owner/repository format. DreamMakerHub validates this value before workspace creation."
  icon         = "/icon/github.svg"
  type         = "string"
  default      = ""
  mutable      = false
}

data "coder_parameter" "repo_branch" {
  name         = "repo_branch"
  display_name = "Repository Branch"
  description  = "Branch to clone when a GitHub repository is selected."
  icon         = "/icon/git.svg"
  type         = "string"
  default      = "main"
  mutable      = false
}
data "coder_parameter" "region" {
  name         = "region"
  display_name = "Region"
  description  = "Railway region for the workspace."
  icon         = "/emojis/1f30e.png"
  type         = "string"
  default      = "us-west1"
  mutable      = false
  option {
    name  = "US West"
    value = "us-west1"
    icon  = "/emojis/1f1fa-1f1f8.png"
  }
  option {
    name  = "US East"
    value = "us-east4"
    icon  = "/emojis/1f1fa-1f1f8.png"
  }
  option {
    name  = "Europe West"
    value = "europe-west4"
    icon  = "/emojis/1f1ea-1f1fa.png"
  }
  option {
    name  = "Asia Southeast"
    value = "asia-southeast1"
    icon  = "/emojis/1f1f8-1f1ec.png"
  }
}

# ---------------------------------------------------------------------------
# Coder agent
# ---------------------------------------------------------------------------

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  startup_script = <<-EOT
    set -e

    # /home/coder is the Railway persistent volume. Keep projects, editor
    # state, package caches, and user-installed tools underneath HOME so they
    # survive workspace stop/start and service redeploys.
    if [ ! -f "$HOME/.init_done" ]; then
      cp -rT /etc/skel "$HOME" 2>/dev/null || true
      touch "$HOME/.init_done"
    fi

    mkdir -p \
      "$HOME/projects" \
      "$HOME/.local/bin" \
      "$HOME/.local/lib" \
      "$HOME/.cache/pip" \
      "$HOME/.npm-global" \
      "$HOME/.npm-cache" \
      "$HOME/.local/share/pnpm" \
      "$HOME/.cache/pnpm" \
      "$HOME/.cache/yarn" \
      "$HOME/.cache/bun"

    # Persist package-manager state on the mounted home volume.
    if command -v npm >/dev/null 2>&1; then
      npm config set prefix "$HOME/.npm-global" --location=user >/dev/null 2>&1 || true
      npm config set cache "$HOME/.npm-cache" --location=user >/dev/null 2>&1 || true
    fi

    if command -v pnpm >/dev/null 2>&1; then
      pnpm config set store-dir "$HOME/.local/share/pnpm/store" --global >/dev/null 2>&1 || true
    fi

    if command -v yarn >/dev/null 2>&1; then
      yarn config set cache-folder "$HOME/.cache/yarn" >/dev/null 2>&1 || true
    fi

    # Add persistent user-level tool locations to every shell without
    # duplicating the block on each start.
    for shell_rc in "$HOME/.profile" "$HOME/.bashrc"; do
      touch "$shell_rc"
      if ! grep -q "AI_WONDERLAND_PERSISTENT_TOOLS" "$shell_rc"; then
        cat >> "$shell_rc" <<'PERSISTENT_TOOLS'
# AI_WONDERLAND_PERSISTENT_TOOLS
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.local/share/pnpm:$PATH"
export PYTHONUSERBASE="$HOME/.local"
export PIP_CACHE_DIR="$HOME/.cache/pip"
export PNPM_HOME="$HOME/.local/share/pnpm"
export NPM_CONFIG_CACHE="$HOME/.npm-cache"
export YARN_CACHE_FOLDER="$HOME/.cache/yarn"
# AI_WONDERLAND_PERSISTENT_TOOLS_END
PERSISTENT_TOOLS
      fi
    done

    # Git repos and project-local dependencies installed below ~/projects are
    # already persistent because the whole /home/coder path is a Railway volume.
    git config --global init.defaultBranch main >/dev/null 2>&1 || true

    # DreamMakerHub may pass a validated public GitHub repository and branch
    # from the IDE launch form. Clone it once into the persistent home volume.
    REPO_SLUG="${data.coder_parameter.repo_url.value}"
    REPO_BRANCH="${data.coder_parameter.repo_branch.value}"
    if [ -n "$REPO_SLUG" ]; then
      REPO_NAME="$(basename "$REPO_SLUG")"
      REPO_DIR="$HOME/projects/$REPO_NAME"
      if [ ! -d "$REPO_DIR/.git" ]; then
        echo "Cloning $REPO_SLUG ($REPO_BRANCH) into $REPO_DIR..."
        git clone --branch "$REPO_BRANCH" --single-branch \
          "https://github.com/$REPO_SLUG.git" "$REPO_DIR"
      else
        echo "Repository already present at $REPO_DIR; keeping persistent checkout."
      fi

      printf 'export AI_WONDERLAND_PROJECT=%q\n' "$REPO_DIR" > "$HOME/.ai-wonderland-project"
      if ! grep -q "AI_WONDERLAND_PROJECT_FILE" "$HOME/.bashrc"; then
        cat >> "$HOME/.bashrc" <<'PROJECT_DIR'
# AI_WONDERLAND_PROJECT_FILE
[ -f "$HOME/.ai-wonderland-project" ] && . "$HOME/.ai-wonderland-project"
# AI_WONDERLAND_PROJECT_FILE_END
PROJECT_DIR
      fi
    fi
  EOT

  metadata {
    display_name = "CPU Usage"
    key          = "0_cpu_usage"
    script       = "coder stat cpu"
    interval     = 10
    timeout      = 1
  }
  metadata {
    display_name = "RAM Usage"
    key          = "1_ram_usage"
    script       = "coder stat mem"
    interval     = 10
    timeout      = 1
  }
  metadata {
    display_name = "Home Disk"
    key          = "3_home_disk"
    script       = "coder stat disk --path $${HOME}"
    interval     = 60
    timeout      = 1
  }
}

# ===========================================================================
# Railway resources, all via GraphQL
# ===========================================================================

# Helper: every curl call follows this pattern:
#   1. POST the mutation.
#   2. Print the response (for terraform logs).
#   3. grep for "errors", exit 1 if found.
#   4. Extract the ID with sed and write to state file.

# ---------------------------------------------------------------------------
# 1. Project (persistent)
# ---------------------------------------------------------------------------
resource "terraform_data" "project" {
  # Triggers replacement if project name changes. Stores token and
  # project name so the destroy provisioner can authenticate and find
  # the project by name without depending on state files.
  input = {
    project_name = local.project_name
    token        = var.railway_token
    scripts_dir  = local.scripts_dir
  }

  triggers_replace = local.project_name

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "bash ${local.scripts_dir}/project_create.sh"
    environment = {
      API          = local.railway_api
      TOKEN        = var.railway_token
      PROJECT_NAME = local.project_name
      STATE_DIR    = local.state_dir
    }
  }

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["bash", "-c"]
    command     = "bash ${self.input.scripts_dir}/project_destroy.sh"
    environment = {
      API          = "https://backboard.railway.com/graphql/v2"
      TOKEN        = self.input.token
      PROJECT_NAME = self.input.project_name
    }
  }
}

# ---------------------------------------------------------------------------
# 2. Service (persistent)
# ---------------------------------------------------------------------------
resource "terraform_data" "service" {
  input = {
    token       = var.railway_token
    scripts_dir = local.scripts_dir
  }
  depends_on = [terraform_data.project]

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "bash ${local.scripts_dir}/service_create.sh"
    environment = {
      API          = local.railway_api
      TOKEN        = var.railway_token
      PROJECT_NAME = local.project_name
      STATE_DIR    = local.state_dir
    }
  }

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["bash", "-c"]
    command     = "bash ${self.input.scripts_dir}/service_destroy.sh"
    environment = {
      API   = "https://backboard.railway.com/graphql/v2"
      TOKEN = self.input.token
    }
  }
}

# ---------------------------------------------------------------------------
# 3. Volume (persistent)
#
# CRITICAL: This must run before ANY deployment activity on the service.
# Railway rejects volumeCreate on services that have had deployments.
# By using pure GraphQL we control ordering exactly.
# ---------------------------------------------------------------------------
resource "terraform_data" "volume" {
  input      = var.railway_token
  depends_on = [terraform_data.service]

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "bash ${local.scripts_dir}/volume_create.sh"
    environment = {
      API          = local.railway_api
      TOKEN        = var.railway_token
      PROJECT_NAME = local.project_name
      STATE_DIR    = local.state_dir
    }
  }

  # Volume is deleted when service/project is deleted (cascade).
}

# ---------------------------------------------------------------------------
# 4. Environment variables (ephemeral, only when started)
#
# Set BEFORE the image is attached, so that when the first deployment
# runs it already has the correct env vars. This avoids triggering
# extra redeploys that would happen if we upserted vars after the
# source was set (each variableUpsert on a connected service triggers
# a redeploy).
# ---------------------------------------------------------------------------
resource "terraform_data" "env_vars" {
  count      = data.coder_workspace.me.start_count
  depends_on = [terraform_data.volume]

  input = {
    token        = var.railway_token
    project_name = local.project_name
    scripts_dir  = local.scripts_dir
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "bash ${local.scripts_dir}/env_vars_create.sh"
    environment = {
      API                   = local.railway_api
      TOKEN                 = var.railway_token
      PROJECT_NAME          = local.project_name
      STATE_DIR             = local.state_dir
      CODER_INIT_SCRIPT_B64 = base64encode(coder_agent.main.init_script)
      CODER_AGENT_TOKEN     = coder_agent.main.token
    }
  }

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["bash", "-c"]
    command     = "bash ${self.input.scripts_dir}/env_vars_destroy.sh"
    environment = {
      API          = "https://backboard.railway.com/graphql/v2"
      TOKEN        = self.input.token
      PROJECT_NAME = self.input.project_name
    }
  }
}

# ---------------------------------------------------------------------------
# 4b. Project-scoped Railway token + RAILWAY_TOKEN env var (optional).
#
# When var.enable_project_management is true, provision a Railway
# project-scoped token via projectTokenCreate and upsert it as
# RAILWAY_TOKEN on the workspace service. The Coder script
# `railway_cli` (below) installs the Railway CLI in the workspace.
# The CLI auto-picks up RAILWAY_TOKEN from the container env.
#
# Persistent across stop/start (count is tied to the variable, not
# start_count). The token survives until workspace delete, when the
# destroy provisioner deletes it and the env var. The variableUpsert
# happens before image_deploy, so the first deploy already has
# RAILWAY_TOKEN in scope.
# ---------------------------------------------------------------------------
resource "terraform_data" "project_token" {
  count      = var.enable_project_management ? 1 : 0
  depends_on = [terraform_data.project, terraform_data.service]

  triggers_replace = local.project_name

  input = {
    token        = var.railway_token
    project_name = local.project_name
    scripts_dir  = local.scripts_dir
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "bash ${local.scripts_dir}/project_token_create.sh"
    environment = {
      API          = local.railway_api
      TOKEN        = var.railway_token
      PROJECT_NAME = local.project_name
      STATE_DIR    = local.state_dir
    }
  }

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["bash", "-c"]
    command     = "bash ${self.input.scripts_dir}/project_token_destroy.sh"
    environment = {
      API          = "https://backboard.railway.com/graphql/v2"
      TOKEN        = self.input.token
      PROJECT_NAME = self.input.project_name
    }
  }
}

# ---------------------------------------------------------------------------
# 5. Image deploy (ephemeral, only when started)
#
# Points the workspace service at a pre-built container image and
# triggers the first deployment. Two GraphQL calls:
#   1. serviceInstanceUpdate(source: { image, registryCredentials? })
#      Updates the source. Does NOT trigger a deploy on its own in
#      current Railway behavior.
#   2. serviceInstanceDeployV2(serviceId, environmentId)
#      Explicitly triggers a deploy of the current config.
#
# On stop, the destroy provisioner cancels active deployments to
# scale the container to zero, then polls briefly for stray deploys
# that env_vars destroy might race.
# ---------------------------------------------------------------------------
resource "terraform_data" "image_deploy" {
  count      = data.coder_workspace.me.start_count
  depends_on = [terraform_data.env_vars, terraform_data.project_token]

  # Store IDs needed by the destroy provisioner. Destroy provisioners
  # can only reference self, not vars or other resources.
  input = {
    token        = var.railway_token
    project_name = local.project_name
    scripts_dir  = local.scripts_dir
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = "bash ${local.scripts_dir}/image_deploy_create.sh"
    environment = {
      API                     = local.railway_api
      TOKEN                   = var.railway_token
      PROJECT_NAME            = local.project_name
      STATE_DIR               = local.state_dir
      WORKSPACE_IMAGE         = var.workspace_image
      IMAGE_REGISTRY_USERNAME = var.image_registry_username
      IMAGE_REGISTRY_PASSWORD = var.image_registry_password
    }
  }

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["bash", "-c"]
    command     = "bash ${self.input.scripts_dir}/image_deploy_destroy.sh"
    environment = {
      API          = "https://backboard.railway.com/graphql/v2"
      TOKEN        = self.input.token
      PROJECT_NAME = self.input.project_name
    }
  }
}


# ===========================================================================
# Metadata and apps
# ===========================================================================

resource "coder_metadata" "workspace" {
  resource_id = coder_agent.main.id
  item {
    key   = "region"
    value = data.coder_parameter.region.value
  }
  item {
    key   = "image"
    value = var.workspace_image
  }
  item {
    key   = "repository"
    value = data.coder_parameter.repo_url.value != "" ? data.coder_parameter.repo_url.value : "blank workspace"
  }
  item {
    key   = "branch"
    value = data.coder_parameter.repo_url.value != "" ? data.coder_parameter.repo_branch.value : "n/a"
  }
  item {
    key   = "project_id"
    value = try(file("${local.state_dir}/project_id"), "pending")
  }
  item {
    key   = "service_id"
    value = try(file("${local.state_dir}/service_id"), "pending")
  }
}

module "git-config" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/coder/git-config/coder"
  version  = "~> 1.0"
  agent_id = coder_agent.main.id
}

module "code-server" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/coder/code-server/coder"
  version  = "~> 1.0"
  agent_id = coder_agent.main.id
  folder   = data.coder_parameter.repo_url.value != "" ? "/home/coder/projects/${basename(data.coder_parameter.repo_url.value)}" : "/home/coder/projects"
  order    = 1
}

# Optional: install the Railway CLI on workspace start when project
# management is enabled. The CLI auto-authenticates against the
# project-scoped RAILWAY_TOKEN that terraform_data.project_token sets
# on the workspace service, so the user can immediately run e.g.
# `railway status`, `railway logs`, `railway up`, `railway run -- npm test`.
#
# The installer writes to ~/.railway which is on the persistent home
# volume, so subsequent starts are instant (no re-download).
resource "coder_script" "railway_cli" {
  count              = var.enable_project_management ? 1 : 0
  agent_id           = coder_agent.main.id
  display_name       = "Install Railway CLI"
  icon               = "/icon/railway.svg"
  run_on_start       = true
  start_blocks_login = false

  script = <<-EOT
    set -eu

    # Install Railway CLI to ~/.railway if not already present.
    # The upstream installer is bash-only; running it via /bin/sh
    # surfaces a harmless "Bad substitution" error and a non-zero
    # exit, which Coder reports as a startup-script failure. Run it
    # explicitly under bash and ignore its exit code; we verify the
    # binary after.
    if ! [ -x "$HOME/.railway/bin/railway" ]; then
      echo "Installing Railway CLI..."
      curl -fsSL https://railway.app/install.sh -o /tmp/railway-install.sh
      bash /tmp/railway-install.sh || true
      rm -f /tmp/railway-install.sh
    fi

    if ! [ -x "$HOME/.railway/bin/railway" ]; then
      echo "ERROR: Railway CLI install failed."
      exit 1
    fi

    # Symlink into /usr/local/bin so the CLI is on PATH for every
    # shell, including non-interactive `coder ssh ... -- cmd` runs.
    # ~/.bashrc would only work for interactive shells; setting the
    # PATH in coder_agent.env would not survive new bash sessions.
    if ! [ -e /usr/local/bin/railway ]; then
      sudo ln -sf "$HOME/.railway/bin/railway" /usr/local/bin/railway
    fi

    echo ""
    echo "Railway CLI ready. RAILWAY_TOKEN is set to a project-scoped"
    echo "token for this workspace's Railway project. Try:"
    echo "  railway status"
    echo "  railway logs --service workspace"
    echo "  railway variables"
  EOT
}
