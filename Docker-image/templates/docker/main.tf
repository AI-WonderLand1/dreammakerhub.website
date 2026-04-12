terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = ">= 2.12"
    }
    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

locals {
  username = data.coder_workspace_owner.me.name
}

variable "docker_socket" {
  default     = ""
  description = "(Optional) Docker socket URI"
  type        = string
}

variable "workspace_image" {
  default     = "wonderspace-ide-workspace:latest"
  description = "Docker image for the workspace. Customize .devcontainer/Dockerfile and rebuild."
  type        = string
}

provider "docker" {
  host = var.docker_socket != "" ? var.docker_socket : null
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# --- Plugin packs (free, optional) ---
data "coder_parameter" "plugin_pack" {
  description  = "Optional extension packs. Core IDE always includes essential tools. These add specialized extensions at startup."
  display_name = "Plugin Pack (Free)"
  icon         = "/icon/extensions.svg"
  mutable      = true
  name         = "plugin_pack"
  order        = 10
  default      = "none"
  option {
    name        = "Core IDE"
    description = "ESLint, Prettier, GitLens, Material Icons — always included."
    value       = "none"
  }
  option {
    name        = "Web Developer"
    description = "+ Tailwind, auto-rename tag, and more web tooling."
    value       = "web"
  }
  option {
    name        = "Infrastructure"
    description = "+ Terraform, Docker, Kubernetes extensions."
    value       = "infra"
  }
  option {
    name        = "Data Science"
    description = "+ Jupyter, Python, R tooling."
    value       = "data"
  }
  option {
    name        = "Full Stack"
    description = "All extension packs combined."
    value       = "full"
  }
}

# --- AI Assistant (free text+voice, paid agents/runners) ---
data "coder_parameter" "agent_tier" {
  description  = "AI text and voice coding are free. Agents and runners that run tasks autonomously are paid add-ons."
  display_name = "AI & Agents"
  icon         = "/icon/ai.svg"
  mutable      = true
  name         = "agent_tier"
  order        = 11
  default      = "free"
  option {
    name        = "Free — Text + Voice AI"
    description = "AI assistant with text and voice input. No API key needed. Always free."
    value       = "free"
  }
  option {
    name        = "Pro — + Agents ($0.05/task)"
    description = "Everything in Free plus autonomous AI agents that run multi-step coding tasks. $0.05 per agent task."
    value       = "agents"
  }
  option {
    name        = "Enterprise — + Runners ($0.10/run)"
    description = "Everything in Pro plus CI/CD runners, batch execution, and fleet management. $0.10 per runner invocation."
    value       = "runners"
  }
}

# --- Resource size ---
data "coder_parameter" "cpu" {
  description  = "Number of CPU cores for your workspace"
  display_name = "CPU (cores)"
  icon         = "/icon/cpu.svg"
  mutable      = true
  name         = "cpu"
  order        = 12
  default      = "2"
  option {
    name  = "2 Cores"
    value = "2"
  }
  option {
    name  = "4 Cores"
    value = "4"
  }
  option {
    name  = "8 Cores"
    value = "8"
  }
}

data "coder_parameter" "memory" {
  description  = "Memory for your workspace"
  display_name = "Memory (GB)"
  icon         = "/icon/memory.svg"
  mutable      = true
  name         = "memory"
  order        = 13
  default      = "4"
  option {
    name  = "4 GB"
    value = "4"
  }
  option {
    name  = "8 GB"
    value = "8"
  }
  option {
    name  = "16 GB"
    value = "16"
  }
}

data "coder_parameter" "home_disk_size" {
  description  = "Persistent storage for your home directory"
  display_name = "Disk (GB)"
  icon         = "/icon/disk.svg"
  mutable      = true
  name         = "home_disk_size"
  order        = 14
  default      = "20"
  option {
    name  = "20 GB"
    value = "20"
  }
  option {
    name  = "50 GB"
    value = "50"
  }
  option {
    name  = "100 GB"
    value = "100"
  }
}

locals {
  # Core extensions — always included (free)
  core_extensions = [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "eamodio.gitlens",
    "pkief.material-icon-theme",
  ]

  # Optional plugin packs (free, not bundled — installed at workspace startup)
  web_extensions = [
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
  ]
  infra_extensions = [
    "hashicorp.terraform",
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
  ]
  data_extensions = [
    "ms-toolsai.jupyter",
    "ms-python.python",
  ]

  selected_extensions = data.coder_parameter.plugin_pack.value == "web" ? concat(local.core_extensions, local.web_extensions) : data.coder_parameter.plugin_pack.value == "infra" ? concat(local.core_extensions, local.infra_extensions) : data.coder_parameter.plugin_pack.value == "data" ? concat(local.core_extensions, local.data_extensions) : data.coder_parameter.plugin_pack.value == "full" ? concat(local.core_extensions, local.web_extensions, local.infra_extensions, local.data_extensions) : local.core_extensions
}

resource "coder_agent" "main" {
  arch           = data.coder_provisioner.me.arch
  os             = "linux"
  startup_script = <<-EOT
    set -e

    if [ ! -f ~/.init_done ]; then
      cp -rT /etc/skel ~
      touch ~/.init_done
    fi

    # Write AI tier config
    mkdir -p ~/.config/wonderspace
    cat > ~/.config/wonderspace/ai-config.json <<'AICONF'
    {"tier":"${data.coder_parameter.agent_tier.value}","voice":true,"agents":${data.coder_parameter.agent_tier.value != "free"},"runners":${data.coder_parameter.agent_tier.value == "runners"}}
    AICONF

    # Install voice support (free — always available)
    if ! command -v ffmpeg &>/dev/null; then
      echo "Installing voice dependencies..."
      sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg portaudio19-dev 2>/dev/null || true
    fi

    # Install plugin pack extensions at startup
    if [ "${data.coder_parameter.plugin_pack.value}" != "none" ]; then
      echo "Installing ${data.coder_parameter.plugin_pack.value} plugin pack..."
    fi
  EOT

  env = {
    GIT_AUTHOR_NAME     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_AUTHOR_EMAIL    = "${data.coder_workspace_owner.me.email}"
    GIT_COMMITTER_NAME  = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
    GIT_COMMITTER_EMAIL = "${data.coder_workspace_owner.me.email}"
    WONDERSPACE_AI_TIER = data.coder_parameter.agent_tier.value
    WONDERSPACE_PLUGINS = data.coder_parameter.plugin_pack.value
  }

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

  metadata {
    display_name = "CPU Usage (Host)"
    key          = "4_cpu_usage_host"
    script       = "coder stat cpu --host"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Memory Usage (Host)"
    key          = "5_mem_usage_host"
    script       = "coder stat mem --host"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Load Average (Host)"
    key          = "6_load_host"
    script       = <<EOT
      echo "`cat /proc/loadavg | awk '{ print $1 }'` `nproc`" | awk '{ printf "%0.2f", $1/$2 }'
    EOT
    interval     = 60
    timeout      = 1
  }

  metadata {
    display_name = "Swap Usage (Host)"
    key          = "7_swap_host"
    script       = <<EOT
      free -b | awk '/^Swap/ { printf("%.1f/%.1f", $3/1024.0/1024.0/1024.0, $2/1024.0/1024.0/1024.0) }'
    EOT
    interval     = 10
    timeout      = 1
  }
}

# VS Code in browser — mobile + desktop friendly, always free
module "code-server" {
  count      = data.coder_workspace.me.start_count
  source     = "registry.coder.com/coder/code-server/coder"
  version    = "1.4.4"
  agent_id   = coder_agent.main.id
  agent_name = "main"
  order      = 1
  offline    = true
  extensions = local.selected_extensions
  settings = {
    "workbench.colorTheme"                     = "Default Dark+"
    "editor.fontSize"                          = "14"
    "editor.formatOnSave"                      = "true"
    "editor.tabSize"                           = "2"
    "editor.insertSpaces"                      = "true"
    "editor.detectIndentation"                 = "false"
    "editor.wordWrap"                          = "on"
    "editor.minimap.enabled"                   = "false"
    "editor.lineNumbers"                       = "on"
    "editor.cursorBlinking"                    = "smooth"
    "editor.cursorSmoothCaretAnimation"        = "on"
    "editor.smoothScrolling"                   = "true"
    "files.eol"                                = "\n"
    "terminal.integrated.defaultProfile.linux" = "zsh"
    "terminal.integrated.fontSize"             = "14"
    "terminal.integrated.scrollback"           = "10000"
    "git.confirmSync"                          = "false"
    "git.enableSmartCommit"                    = "true"
    "git.autofetch"                            = "true"
    "workbench.editor.wrapTabs"                = "true"
    "workbench.sideBar.location"               = "left"
    "window.menuBarVisibility"                 = "compact"
    "terraform.languageServer.enable"          = "true"
  }
  additional_args = "--disable-workspace-trust"
}

# JetBrains IDEs (free — desktop only)
module "jetbrains" {
  count      = data.coder_workspace.me.start_count
  source     = "registry.coder.com/modules/coder/jetbrains/coder"
  version    = "~> 1.0"
  agent_id   = coder_agent.main.id
  agent_name = "main"
  folder     = "/home/coder"
}

# AI assistant — routes through billing gateway (your monetization layer)
resource "coder_app" "ai-assistant" {
  count        = data.coder_workspace.me.start_count
  agent_id     = coder_agent.main.id
  display_name = "AI Assistant"
  slug         = "ai-assistant"
  icon         = "/icon/ai.svg"
  command      = "bash -c 'echo \"Starting AI Assistant...\" && while true; do curl -s http://host.docker.internal:8888/healthz > /dev/null && echo \"AI ready\" || echo \"AI connecting...\"; sleep 5; done'"
  order        = 2
  # The actual AI interface runs through the billing gateway on port 8888
  # Users access it via the Coder dashboard - all requests go through your monetization layer
}

# Voice terminal — always free, install ffmpeg on startup
resource "coder_app" "voice_terminal" {
  count        = data.coder_workspace.me.start_count
  agent_id     = coder_agent.main.id
  display_name = "Voice Terminal"
  icon         = "/icon/terminal.svg"
  slug         = "voice-terminal"
  command      = "bash -c 'if command -v ffmpeg &>/dev/null; then exec zsh; else echo Installing voice deps... && sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg portaudio19-dev && exec zsh; fi'"
  order        = 3
  healthcheck {
    url       = "http://localhost:8080/healthz"
    interval  = 60
    threshold = 10
  }
}

resource "docker_volume" "home_volume" {
  name = "coder-${data.coder_workspace.me.id}-home"
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
}

resource "docker_container" "workspace" {
  count      = data.coder_workspace.me.start_count
  image      = var.workspace_image
  name       = "coder-${data.coder_workspace_owner.me.name}-${lower(data.coder_workspace.me.name)}"
  hostname   = data.coder_workspace.me.name
  entrypoint = ["sh", "-c", replace(coder_agent.main.init_script, "/localhost|127\\.0\\.0\\.1/", "host.docker.internal")]
  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
    "WONDERSPACE_AI_TIER=${data.coder_parameter.agent_tier.value}",
    "WONDERSPACE_PLUGINS=${data.coder_parameter.plugin_pack.value}"
  ]
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
}