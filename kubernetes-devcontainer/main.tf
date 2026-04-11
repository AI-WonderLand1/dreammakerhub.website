terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 2.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

provider "coder" {
  url = var.coder_url
}

provider "kubernetes" {
  # Explicitly tell it NOT to use a local config file
  load_config_file = false

  # Use the host from your variables
  host = var.k8s_host

  # Use the token we fetched from the Vault
  token = local.vault_token

  # Since it's OKE, we keep this to bypass cert issues
  insecure = true
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# --- VARIABLES & PARAMETERS ---

variable "ide_image" {
  type        = string
  description = "Pre-built IDE container image from OCIR (leave empty to use <oci_registry>/ide:latest)"
  default     = ""
}

data "coder_parameter" "cpu" {
  type         = "number"
  name         = "cpu"
  display_name = "CPU Cores"
  default      = "2"
}

data "coder_parameter" "memory" {
  type         = "number"
  name         = "memory"
  display_name = "Memory (GiB)"
  default      = "4"
}

data "coder_parameter" "storage" {
  type         = "number"
  name         = "storage"
  display_name = "Storage (GiB)"
  default      = "10"
}

data "coder_parameter" "repo" {
  type         = "string"
  name         = "repo"
  display_name = "Git Repository"
  default      = "https://github.com/wonderingtribe/psychic-octo-fishstick"
}

locals {
  workspace_name = "coder-${lower(data.coder_workspace.me.id)}"
  owner_name     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
  owner_email    = data.coder_workspace_owner.me.email
  vault_token = var.k8s_token != "" ? var.k8s_token : (
    fileexists("/var/run/secrets/kubernetes.io/serviceaccount/token")
    ? trimspace(file("/var/run/secrets/kubernetes.io/serviceaccount/token"))
    : ""
  )
  resolved_ide_image = var.ide_image != "" ? var.ide_image : "${var.oci_registry}/ide:latest"
}

# --- KUBERNETES RESOURCES ---

# 1. Create the Namespace
resource "kubernetes_namespace" "wonderland" {
  metadata {
    name = var.namespace
  }
}

# 2. Create the Persistent Volume Claim
resource "kubernetes_persistent_volume_claim_v1" "workspaces" {
  depends_on = [kubernetes_namespace.wonderland]
  metadata {
    name      = "${local.workspace_name}-data"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-workspace"
      "app.kubernetes.io/instance" = local.workspace_name
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
    }
  }
  wait_until_bound = false
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = { storage = "${data.coder_parameter.storage.value}Gi" }
    }
  }
}

# 3. Create the Deployment
resource "kubernetes_deployment_v1" "main" {
  count = data.coder_workspace.me.start_count

  depends_on = [
    kubernetes_namespace.wonderland,
    kubernetes_persistent_volume_claim_v1.workspaces
  ]

  wait_for_rollout = false

  metadata {
    name      = local.workspace_name
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"     = "coder-workspace"
      "app.kubernetes.io/instance" = local.workspace_name
      "com.coder.resource"         = "true"
      "com.coder.workspace.id"     = data.coder_workspace.me.id
      "com.coder.user.username"    = data.coder_workspace_owner.me.name
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        "app.kubernetes.io/name"     = "coder-workspace"
        "app.kubernetes.io/instance" = local.workspace_name
      }
    }
    strategy { type = "Recreate" }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name"     = "coder-workspace"
          "app.kubernetes.io/instance" = local.workspace_name
        }
      }

      spec {
        dynamic "image_pull_secrets" {
          for_each = var.cache_repo_dockerconfig_secret != "" ? [var.cache_repo_dockerconfig_secret] : []
          content {
            name = image_pull_secrets.value
          }
        }

        container {
          name              = "ide"
          image             = local.resolved_ide_image
          image_pull_policy = "IfNotPresent"

          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          env {
            name  = "PORT"
            value = "8080"
          }

          port {
            container_port = 8080
            name           = "ide"
          }

          resources {
            requests = {
              cpu    = "500m"
              memory = "1Gi"
            }
            limits = {
              cpu    = "${data.coder_parameter.cpu.value}"
              memory = "${data.coder_parameter.memory.value}Gi"
            }
          }

          volume_mount {
            mount_path = "/home/coder/project"
            name       = "workspaces"
          }
        }

        volume {
          name = "workspaces"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.workspaces.metadata[0].name
          }
        }
      }
    }
  }
}

# --- CODER AGENT ---

resource "coder_agent" "main" {
  arch           = data.coder_provisioner.me.arch
  os             = "linux"
  dir            = "/home/coder/project"
  startup_script = <<-EOT
    #!/bin/bash
    set -e
    mkdir -p /home/coder/project
    echo "Workspace ready!"
  EOT
}

# --- OUTPUTS ---

output "workspace_url" {
  value = "${var.coder_url}/@${coder_agent.main.id}"
}
