# ============================================================================
# AI WONDERLAND - Google Docker Coder workspace template
# ============================================================================
#
# Runtime:
#   Coder -> external provisioner (environment=google) -> Google VM Docker
#
# Each running workspace gets:
#   - one isolated Docker container
#   - one persistent Docker volume mounted at /home/coder
#   - Coder agent
#   - code-server
#   - Git Config
#   - File Browser
#
# IMPORTANT:
# Do not override the workspace image ENTRYPOINT. The AI WONDERLAND image
# starts as root only long enough to repair persistent-volume ownership, then
# /coder-entrypoint.sh launches the Coder init script as the unprivileged
# "coder" user.
# ============================================================================

terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }

    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

provider "coder" {}

variable "docker_socket" {
  type        = string
  default     = ""
  description = "(Optional) Docker socket URI. Leave blank to use the provisioner's default Docker socket."
}

variable "workspace_image" {
  type        = string
  default     = "ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest"
  description = "Operator-controlled AI WONDERLAND workspace image."
}

provider "docker" {
  host = var.docker_socket != "" ? var.docker_socket : null
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# Customer-selectable compute profile. The website sends only one of these
# reviewed IDs; raw CPU/RAM values never come from the browser.
data "coder_parameter" "machine_profile" {
  name         = "machine_profile"
  display_name = "Machine profile"
  description  = "Bounded CPU and memory profile for this workspace."
  type         = "string"
  default      = "micro"
  mutable      = true

  option {
    name  = "Micro · 1 CPU / 2 GiB"
    value = "micro"
  }

  option {
    name  = "Standard · 2 CPU / 4 GiB"
    value = "standard"
  }
}

locals {
  workspace_profiles = {
    micro = {
      cpu       = 1
      memory_mb = 2048
    }
    standard = {
      cpu       = 2
      memory_mb = 4096
    }
  }

  selected_profile = local.workspace_profiles[data.coder_parameter.machine_profile.value]
}

# ============================================================================
# Workspace image
# ============================================================================

data "docker_registry_image" "workspace" {
  name = var.workspace_image
}

resource "docker_image" "workspace" {
  name = data.docker_registry_image.workspace.name

  pull_triggers = [
    data.docker_registry_image.workspace.sha256_digest
  ]

  keep_locally = true
}

# ============================================================================
# Coder agent
# ============================================================================

resource "coder_agent" "main" {
  arch = data.coder_provisioner.me.arch
  os   = "linux"

  startup_script = <<-EOT
    set -e

    # /home/coder is persistent. The image entrypoint has already repaired
    # ownership and switched this process to the unprivileged coder user.
    if [ ! -f "$HOME/.init_done" ]; then
      cp -rT /etc/skel "$HOME" 2>/dev/null || true
      touch "$HOME/.init_done"
    fi

    mkdir -p \
      "$HOME/projects" \
      "$HOME/.filebrowser" \
      "$HOME/.local/bin" \
      "$HOME/.local/lib" \
      "$HOME/.cache/pip" \
      "$HOME/.npm-global" \
      "$HOME/.npm-cache" \
      "$HOME/.local/share/pnpm" \
      "$HOME/.cache/pnpm" \
      "$HOME/.cache/yarn" \
      "$HOME/.cache/bun"

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

    git config --global init.defaultBranch main >/dev/null 2>&1 || true
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
    key          = "2_home_disk"
    script       = "coder stat disk --path $HOME"
    interval     = 60
    timeout      = 1
  }
}

# ============================================================================
# Workspace applications
# ============================================================================

module "code-server" {
  count = data.coder_workspace.me.start_count

  source  = "registry.coder.com/coder/code-server/coder"
  version = "1.5.0"

  agent_id = coder_agent.main.id

  additional_args         = ""
  auto_install_extensions = false
  extensions_dir          = ""
  folder                  = "/home/coder/projects"
  install_version         = ""
  offline                 = false
  open_in                 = "slim-window"
  port                    = 13337
  use_cached              = false
  use_cached_extensions   = false
  workspace               = ""
}

module "git-config" {
  count = data.coder_workspace.me.start_count

  source  = "registry.coder.com/coder/git-config/coder"
  version = "1.0.33"

  agent_id = coder_agent.main.id

  allow_email_change    = false
  allow_username_change = true
}

module "filebrowser" {
  count = data.coder_workspace.me.start_count

  source  = "registry.coder.com/coder/filebrowser/coder"
  version = "1.1.5"

  agent_id      = coder_agent.main.id
  agent_name    = null
  database_path = "/home/coder/.filebrowser/filebrowser.db"
  folder        = "/home/coder"
  port          = 13339
}

# ============================================================================
# Persistent user home
# ============================================================================

resource "docker_volume" "home_volume" {
  name = format("coder-%s-home", data.coder_workspace.me.id)

  lifecycle {
    ignore_changes = all
  }

  labels {
    label = "coder.owner"
    value = data.coder_workspace_owner.me.name
  }

  labels {
    label = "coder.owner_id"
    value = data.coder_workspace_owner.me.id
  }

  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.me.id
  }

  labels {
    label = "coder.workspace_name_at_creation"
    value = data.coder_workspace.me.name
  }

  labels {
    label = "ai-wonderland.workspace"
    value = "true"
  }
}

# ============================================================================
# Workspace container
# ============================================================================

resource "docker_container" "workspace" {
  count = data.coder_workspace.me.start_count

  image = docker_image.workspace.image_id

  # Hard per-container resource ceilings on the shared Google Docker host.
  memory      = local.selected_profile.memory_mb
  memory_swap = local.selected_profile.memory_mb
  cpu_period  = 100000
  cpu_quota   = local.selected_profile.cpu * 100000

  name = format(
    "coder-%s-%s",
    data.coder_workspace_owner.me.name,
    lower(data.coder_workspace.me.name)
  )

  hostname = data.coder_workspace.me.name

  # Intentionally do NOT set entrypoint or user here.
  #
  # The image ENTRYPOINT (/coder-entrypoint.sh) starts as root so it can repair
  # /home/coder ownership on a newly-created Docker volume, then it runs this
  # init script as the unprivileged coder user.
  env = [
    format(
      "CODER_INIT_SCRIPT_B64=%s",
      base64encode(
        replace(
          coder_agent.main.init_script,
          "/localhost|127\\.0\\.0\\.1/",
          "host.docker.internal"
        )
      )
    ),
    format("CODER_AGENT_TOKEN=%s", coder_agent.main.token)
  ]

  # Retain the already-tested Docker host-gateway path.
  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  volumes {
    container_path = "/home/coder"
    volume_name    = docker_volume.home_volume.name
    read_only      = false
  }

  labels {
    label = "coder.owner"
    value = data.coder_workspace_owner.me.name
  }

  labels {
    label = "coder.owner_id"
    value = data.coder_workspace_owner.me.id
  }

  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.me.id
  }

  labels {
    label = "coder.workspace_name"
    value = data.coder_workspace.me.name
  }

  labels {
    label = "ai-wonderland.workspace"
    value = "true"
  }

  labels {
    label = "ai-wonderland.runtime"
    value = "google-docker"
  }

  labels {
    label = "ai-wonderland.machine-profile"
    value = data.coder_parameter.machine_profile.value
  }

  depends_on = [
    docker_image.workspace,
    docker_volume.home_volume
  ]
}
