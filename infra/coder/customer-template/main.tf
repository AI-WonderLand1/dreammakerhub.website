# CUSTOMER-ONLY candidate. Publish as a NEW template, never replace the
# operator's existing wonderspace-ide or WonderSpace-ide-template in place.
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
  description = "Dedicated namespace with network policies, quota, and Coder provisioner RBAC"
  default     = "coder-customers"
  validation {
    condition     = var.namespace == "coder-customers"
    error_message = "Customer workspaces must use the separate coder-customers namespace."
  }
}

# Build and test these images yourself, with code-server already installed.
# Only admins configure the digests: users select a profile name, never an image.
variable "linux_image" {
  type        = string
  description = "Admin-approved Linux IDE image pinned to immutable sha256 digest"
  validation {
    condition     = can(regex("@sha256:[a-f0-9]{64}$", var.linux_image))
    error_message = "Use a verified image reference pinned to an immutable sha256 digest."
  }
}
variable "node_image" {
  type        = string
  description = "Admin-approved Node.js IDE image pinned to immutable sha256 digest"
  validation {
    condition     = can(regex("@sha256:[a-f0-9]{64}$", var.node_image))
    error_message = "Use a verified image reference pinned to an immutable sha256 digest."
  }
}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

locals {
  images = {
    linux = var.linux_image
    node  = var.node_image
  }
  machine_profiles = {
    micro    = { cpu = "1", memory = "2Gi" }
    standard = { cpu = "2", memory = "4Gi" }
    power    = { cpu = "4", memory = "8Gi" }
    max      = { cpu = "8", memory = "16Gi" }
  }
}

data "coder_parameter" "ide_image" {
  name         = "ide_image"
  display_name = "IDE environment"
  type         = "string"
  default      = "linux"
  mutable      = false
  option {
    name  = "Linux / VS Code"
    value = "linux"
  }
  option {
    name  = "Node.js / VS Code"
    value = "node"
  }
}

data "coder_parameter" "machine_profile" {
  name         = "machine_profile"
  display_name = "Machine"
  description  = "Larger machines consume the monthly compute pool faster."
  type         = "string"
  default      = "micro"
  mutable      = false
  option {
    name  = "Micro · 1 CPU / 2 GB · 1x compute"
    value = "micro"
  }
  option {
    name  = "Standard · 2 CPU / 4 GB · 2x compute"
    value = "standard"
  }
  option {
    name  = "Power · 4 CPU / 8 GB · 4x compute"
    value = "power"
  }
  option {
    name  = "Max · 8 CPU / 16 GB · 8x compute"
    value = "max"
  }
}

data "coder_parameter" "home_disk_size" {
  name         = "home_disk_size"
  display_name = "Home disk (GiB)"
  type         = "number"
  default      = "10"
  mutable      = false
  validation {
    min = 10
    max = 10
  }
}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"
  startup_script = <<-EOT
    set -eu
    mkdir -p /home/coder/wonderspace
    # Never fetch and execute an installer during customer pod startup.
    command -v code-server >/dev/null || { echo 'Approved IDE image lacks code-server'; exit 1; }
    code-server --auth none --host 127.0.0.1 --port 13337 /home/coder/wonderspace >/tmp/code-server.log 2>&1 &
  EOT
}

resource "coder_app" "code-server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "VS Code"
  url          = "http://localhost:13337/?folder=/home/coder/wonderspace"
  # Requires correctly configured wildcard DNS/TLS; use isolated origin.
  subdomain    = true
  share        = "owner"
  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 10
  }
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "customer-${data.coder_workspace.me.id}-home"
    namespace = var.namespace
    labels = {
      "com.coder.resource"     = "true"
      "com.coder.workspace.id" = data.coder_workspace.me.id
      "com.coder.user.id"      = data.coder_workspace_owner.me.id
    }
  }
  wait_until_bound = false
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = { storage = "${data.coder_parameter.home_disk_size.value}Gi" }
    }
  }
}

resource "kubernetes_deployment_v1" "main" {
  count            = data.coder_workspace.me.start_count
  wait_for_rollout = false
  metadata {
    name      = "customer-${data.coder_workspace.me.id}"
    namespace = var.namespace
    labels = {
      "com.coder.resource"     = "true"
      "com.coder.workspace.id" = data.coder_workspace.me.id
      "com.coder.user.id"      = data.coder_workspace_owner.me.id
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = { "com.coder.workspace.id" = data.coder_workspace.me.id }
    }
    strategy { type = "Recreate" }
    template {
      metadata {
        labels = {
          "com.coder.workspace.id" = data.coder_workspace.me.id
          "com.coder.user.id"      = data.coder_workspace_owner.me.id
        }
      }
      spec {
        automount_service_account_token = false
        security_context {
          run_as_user     = 1000
          fs_group        = 1000
          run_as_non_root = true
          seccomp_profile { type = "RuntimeDefault" }
        }
        container {
          name              = "ide"
          image             = local.images[data.coder_parameter.ide_image.value]
          image_pull_policy = "IfNotPresent"
          command           = ["sh", "-c", coder_agent.main.init_script]
          security_context {
            run_as_user                = 1000
            run_as_non_root            = true
            allow_privilege_escalation = false
            read_only_root_filesystem  = true
            capabilities { drop = ["ALL"] }
          }
          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          resources {
            requests = { cpu = "250m", memory = "512Mi" }
            limits = {
              cpu    = local.machine_profiles[data.coder_parameter.machine_profile.value].cpu
              memory = local.machine_profiles[data.coder_parameter.machine_profile.value].memory
            }
          }
          volume_mount {
            name       = "home"
            mount_path = "/home/coder"
            read_only  = false
          }
          volume_mount {
            name       = "tmp"
            mount_path = "/tmp"
            read_only  = false
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
          name = "tmp"
          empty_dir {}
        }
      }
    }
  }
}
