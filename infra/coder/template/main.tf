terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 2.15.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 3.0"
    }
  }
}

provider "coder" {}

variable "use_kubeconfig" {
  type        = bool
  default     = true
  description = <<-EOF
  Use host kubeconfig? (true/false)
  Set this to false if the Coder host is itself running as a Pod on the same
  Kubernetes cluster as workspaces. Set it to true when Coder is outside the
  workspace cluster/vCluster and a valid ~/.kube/config is mounted on Coder.
  EOF
}

variable "namespace" {
  type        = string
  description = "Namespace used for isolated AI WONDERLAND Coder workspaces."
  default     = "coder-workspaces"
}

variable "create_tun" {
  type        = bool
  description = "Add a TUN device to the workspace."
  default     = false
}

variable "create_fuse" {
  type        = bool
  description = "Add a FUSE device to the workspace."
  default     = false
}

provider "kubernetes" {
  config_path = var.use_kubeconfig ? "~/.kube/config" : null
}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

data "coder_parameter" "cpu" {
  name         = "cpu"
  display_name = "CPU"
  description  = "Maximum CPU cores for this workspace."
  type         = "number"
  default      = 1
  mutable      = true
  validation {
    min = 1
    max = 2
  }
  option {
    name  = "1 Core"
    value = 1
  }
  option {
    name  = "2 Cores"
    value = 2
  }
}

data "coder_parameter" "memory" {
  name         = "memory"
  display_name = "Memory"
  description  = "Maximum memory in GiB for this workspace."
  type         = "number"
  default      = 2
  mutable      = true
  validation {
    min = 1
    max = 4
  }
  option {
    name  = "1 GB"
    value = 1
  }
  option {
    name  = "2 GB"
    value = 2
  }
  option {
    name  = "4 GB"
    value = 4
  }
}

data "coder_parameter" "home_disk_size" {
  name         = "home_disk_size"
  display_name = "Home disk size"
  description  = "Persistent /home/coder disk size in GiB."
  type         = "number"
  default      = 10
  mutable      = false
  validation {
    min = 10
    max = 10
  }
}

data "coder_parameter" "ssh_public_key" {
  name         = "ssh_public_key"
  display_name = "SSH public key"
  description  = "Optional public key supplied by AI WONDERLAND for this workspace."
  type         = "string"
  default      = ""
  mutable      = true
}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  startup_script = <<-EOT
    #!/bin/bash
    set -e
    if [ ! -f ~/.profile ]; then
      cp /etc/skel/.profile "$HOME"
    fi
    if [ ! -f ~/.bashrc ]; then
      cp /etc/skel/.bashrc "$HOME"
    fi
    mkdir -p "$HOME/projects" "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"
    if [ -n "$$${AIW_SSH_PUBLIC_KEY:-}" ]; then
      touch "$HOME/.ssh/authorized_keys"
      if ! grep -qxF "$$${AIW_SSH_PUBLIC_KEY}" "$HOME/.ssh/authorized_keys" 2>/dev/null; then
        printf '%s\n' "$$${AIW_SSH_PUBLIC_KEY}" >> "$HOME/.ssh/authorized_keys"
      fi
      chmod 600 "$HOME/.ssh/authorized_keys"
    fi
    git config --global init.defaultBranch main || true
  EOT

  env = {
    AIW_SSH_PUBLIC_KEY = data.coder_parameter.ssh_public_key.value
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
    key          = "2_home_disk"
    script       = "coder stat disk --path $$HOME"
    interval     = 60
    timeout      = 1
  }
}

module "code-server" {
  count   = data.coder_workspace.me.start_count
  source  = "registry.coder.com/coder/code-server/coder"
  version = "~> 1.0"
  agent_id = coder_agent.main.id
  order    = 1
  folder   = "/home/coder/projects"
}

module "jetbrains" {
  count   = data.coder_workspace.me.start_count
  source  = "registry.coder.com/coder/jetbrains/coder"
  version = "~> 1.0"
  agent_id = coder_agent.main.id
  folder   = "/home/coder/projects"
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "coder-${lower(data.coder_workspace_owner.me.name)}-${lower(data.coder_workspace.me.name)}-home"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/part-of" = "ai-wonderland"
      "com.coder.resource"        = "true"
      "com.coder.workspace.id"    = data.coder_workspace.me.id
      "com.coder.workspace.name"  = data.coder_workspace.me.name
      "com.coder.user.id"         = data.coder_workspace_owner.me.id
      "com.coder.user.username"   = data.coder_workspace_owner.me.name
    }
  }
  wait_until_bound = false
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "${data.coder_parameter.home_disk_size.value}Gi"
      }
    }
  }
}

resource "kubernetes_pod_v1" "main" {
  count = data.coder_workspace.me.start_count

  metadata {
    name      = "coder-${lower(data.coder_workspace_owner.me.name)}-${lower(data.coder_workspace.me.name)}"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"    = "ai-wonderland-workspace"
      "app.kubernetes.io/part-of" = "ai-wonderland"
      "com.coder.resource"        = "true"
      "com.coder.workspace.id"    = data.coder_workspace.me.id
      "com.coder.workspace.name"  = data.coder_workspace.me.name
      "com.coder.user.id"         = data.coder_workspace_owner.me.id
      "com.coder.user.username"   = data.coder_workspace_owner.me.name
    }
  }

  spec {
    restart_policy = "Never"

    container {
      name              = "dev"
      image             = "ghcr.io/coder/envbox:latest"
      image_pull_policy = "IfNotPresent"
      command           = ["/envbox", "docker"]

      security_context {
        privileged = true
      }

      resources {
        requests = {
          cpu    = "250m"
          memory = "512Mi"
        }
        limits = {
          cpu    = tostring(data.coder_parameter.cpu.value)
          memory = "${data.coder_parameter.memory.value}Gi"
        }
      }

      env {
        name  = "CODER_AGENT_TOKEN"
        value = coder_agent.main.token
      }
      env {
        name  = "CODER_AGENT_URL"
        value = data.coder_workspace.me.access_url
      }
      env {
        name  = "CODER_INNER_IMAGE"
        value = "index.docker.io/codercom/enterprise-base:ubuntu-20240812"
      }
      env {
        name  = "CODER_INNER_USERNAME"
        value = "coder"
      }
      env {
        name  = "CODER_BOOTSTRAP_SCRIPT"
        value = coder_agent.main.init_script
      }
      env {
        name  = "CODER_MOUNTS"
        value = "/home/coder:/home/coder"
      }
      env {
        name  = "CODER_ADD_FUSE"
        value = tostring(var.create_fuse)
      }
      env {
        name  = "CODER_INNER_HOSTNAME"
        value = data.coder_workspace.me.name
      }
      env {
        name  = "CODER_ADD_TUN"
        value = tostring(var.create_tun)
      }
      env {
        name = "CODER_CPUS"
        value_from {
          resource_field_ref {
            resource = "limits.cpu"
          }
        }
      }
      env {
        name = "CODER_MEMORY"
        value_from {
          resource_field_ref {
            resource = "limits.memory"
          }
        }
      }

      volume_mount {
        mount_path = "/home/coder"
        name       = "home"
        read_only  = false
        sub_path   = "home"
      }
      volume_mount {
        mount_path = "/var/lib/coder/docker"
        name       = "home"
        sub_path   = "cache/docker"
      }
      volume_mount {
        mount_path = "/var/lib/coder/containers"
        name       = "home"
        sub_path   = "cache/containers"
      }
      volume_mount {
        mount_path = "/var/lib/sysbox"
        name       = "sysbox"
      }
      volume_mount {
        mount_path = "/var/lib/containers"
        name       = "home"
        sub_path   = "envbox/containers"
      }
      volume_mount {
        mount_path = "/var/lib/docker"
        name       = "home"
        sub_path   = "envbox/docker"
      }
      volume_mount {
        mount_path = "/usr/src"
        name       = "usr-src"
      }
      volume_mount {
        mount_path = "/lib/modules"
        name       = "lib-modules"
      }
    }

    volume {
      name = "home"
      persistent_volume_claim {
        claim_name = kubernetes_persistent_volume_claim_v1.home.metadata[0].name
        read_only  = false
      }
    }
    volume {
      name = "sysbox"
      empty_dir {}
    }
    volume {
      name = "usr-src"
      host_path {
        path = "/usr/src"
        type = ""
      }
    }
    volume {
      name = "lib-modules"
      host_path {
        path = "/lib/modules"
        type = ""
      }
    }
  }
}
