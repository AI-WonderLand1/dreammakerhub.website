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

provider "kubernetes" {}

variable "namespace" {
  type        = string
  description = "The Kubernetes namespace to create workspaces in"
  default     = "coder" # Keep this as "coder" - Coder service account has permissions here
}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

locals {
  default_ttl = "4h"
  max_ttl     = "12h"
}

data "coder_parameter" "cpu" {
  name         = "cpu"
  display_name = "CPU"
  description  = "CPU cores (max 4)"
  default      = "1"
  type         = "number"
  icon         = "/icon/memory.svg"
  mutable      = true
  validation {
    min = 1
    max = 4
  }
  option {
    name  = "1 Core"
    value = 1
  }
  option {
    name  = "2 Cores"
    value = 2
  }
  option {
    name  = "3 Cores"
    value = 3
  }
  option {
    name  = "4 Cores"
    value = 4
  }
}

data "coder_parameter" "memory" {
  name         = "memory"
  display_name = "Memory"
  description  = "Memory in GB (max 8)"
  default      = 2
  type         = "number"
  icon         = "/icon/memory.svg"
  mutable      = true
  validation {
    min = 1
    max = 8
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
  option {
    name  = "8 GB"
    value = 8
  }
}

data "coder_parameter" "home_disk_size" {
  name         = "home_disk_size"
  display_name = "Home disk size (GB)"
  default      = "10"
  type         = "number"
  icon         = "/emojis/1f4be.png"
  mutable      = false
  validation {
    min = 1
    max = 50
  }
}

data "coder_parameter" "ssh_public_key" {
  name         = "ssh_public_key"
  display_name = "SSH public key"
  description  = "Optional public key supplied by DreamMakerHub for this workspace"
  default      = ""
  type         = "string"
  mutable      = true
}

variable "autostop" {
  description = "Autostop after inactivity (hours)"
  default     = 4
  type        = number
}

resource "coder_agent" "main" {
  os             = "linux"
  arch           = "amd64"
  startup_script = <<-EOT
    set -e

    mkdir -p /home/coder/wonderspace /home/coder/.ssh
    chmod 700 /home/coder/.ssh

    # Accept the public key supplied by DreamMakerHub without requiring a
    # separate shared IDE pod. Coder's own `coder ssh` remains the canonical
    # authenticated SSH path.
    if [ -n "$${DREAMMAKER_SSH_PUBLIC_KEY:-}" ]; then
      touch /home/coder/.ssh/authorized_keys
      if ! grep -qxF "$${DREAMMAKER_SSH_PUBLIC_KEY}" /home/coder/.ssh/authorized_keys 2>/dev/null; then
        printf '%s\n' "$${DREAMMAKER_SSH_PUBLIC_KEY}" >> /home/coder/.ssh/authorized_keys
      fi
      chmod 600 /home/coder/.ssh/authorized_keys
    fi

    # Install code-server inside the user's isolated workspace pod.
    if [ ! -x /tmp/code-server/bin/code-server ]; then
      curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone --prefix=/tmp/code-server
    fi

    # Coder proxies this localhost-only app and enforces workspace ownership.
    /tmp/code-server/bin/code-server \
      --auth none \
      --port 13337 \
      --host 127.0.0.1 \
      /home/coder/wonderspace \
      >/tmp/code-server.log 2>&1 &

    echo "WonderSpace IDE ready"
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
    script       = "coder stat disk --path $$HOME"
    interval     = 60
    timeout      = 1
  }
}

resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  icon         = "/icon/code.svg"
  url          = "http://localhost:13337/?folder=/home/coder/wonderspace"
  subdomain    = false
  share        = "owner"

  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 10
  }
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "coder-${data.coder_workspace.me.id}-home"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-pvc"
      "app.kubernetes.io/instance" = "coder-pvc-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.workspace.name"   = data.coder_workspace.me.name
      "com.coder.user.id"          = data.coder_workspace_owner.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
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

resource "kubernetes_deployment_v1" "main" {
  count = data.coder_workspace.me.start_count
  wait_for_rollout = false
  metadata {
    name      = "coder-${data.coder_workspace.me.id}"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-workspace"
      "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
      "app.kubernetes.io/part-of"  = "coder"
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.workspace.name"   = data.coder_workspace.me.name
      "com.coder.user.id"          = data.coder_workspace_owner.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        "app.kubernetes.io/name"     = "coder-workspace"
        "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
        "app.kubernetes.io/part-of"  = "coder"
        "com.coder.resource"         = "true"
        "com.coder.workspace.id"     = data.coder_workspace.me.id
        "com.coder.workspace.name"   = data.coder_workspace.me.name
        "com.coder.user.id"          = data.coder_workspace_owner.me.id
        "com.coder.user.username"    = data.coder_workspace_owner.me.name
      }
    }
    strategy {
      type = "Recreate"
    }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name"     = "coder-workspace"
          "app.kubernetes.io/instance" = "coder-workspace-${data.coder_workspace.me.id}"
          "app.kubernetes.io/part-of"  = "coder"
          "com.coder.resource"         = "true"
          "com.coder.workspace.id"     = data.coder_workspace.me.id
          "com.coder.workspace.name"   = data.coder_workspace.me.name
          "com.coder.user.id"          = data.coder_workspace_owner.me.id
          "com.coder.user.username"    = data.coder_workspace_owner.me.name
        }
      }
      spec {
        security_context {
          run_as_user     = 1000
          fs_group        = 1000
          run_as_non_root = true
        }
        container {
          name              = "dev"
          image             = "codercom/enterprise-base:ubuntu"
          image_pull_policy = "IfNotPresent"
          command           = ["sh", "-c", coder_agent.main.init_script]
          security_context {
            run_as_user                = "1000"
            run_as_non_root            = true
            allow_privilege_escalation = false
          }
          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          env {
            name  = "DREAMMAKER_SSH_PUBLIC_KEY"
            value = data.coder_parameter.ssh_public_key.value
          }
          resources {
            requests = {
              "cpu"    = "250m"
              "memory" = "512Mi"
            }
            limits = {
              "cpu"    = "${data.coder_parameter.cpu.value}"
              "memory" = "${data.coder_parameter.memory.value}Gi"
            }
          }
          volume_mount {
            mount_path = "/home/coder"
            name       = "home"
            read_only  = false
          }
        }
        volume {
          name = "home"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.home.metadata.0.name
            read_only  = false
          }
        }
      }
    }
  }
}
