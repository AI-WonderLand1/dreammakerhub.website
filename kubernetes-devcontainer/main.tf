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
  config_path            = var.use_kubeconfig ? "~/.kube/config" : null
  host                   = var.use_kubeconfig ? null : var.k8s_host
  token                  = var.use_kubeconfig ? null : var.k8s_token
  cluster_ca_certificate = var.use_kubeconfig ? null : (var.k8s_ca_cert != "" ? base64decode(var.k8s_ca_cert) : null)
}

data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

variable "ide_image" {
  type        = string
  description = "Pre-built IDE container image from OCIR"
  default     = "wonderspace/ide:latest"
}

data "coder_parameter" "cpu" {
  type         = "number"
  name         = "cpu"
  display_name = "CPU Cores"
  description  = "Number of CPU cores for your workspace"
  default      = "2"
  mutable      = true
  order        = 1
  validation {
    min = 1
    max = 8
  }
}

data "coder_parameter" "memory" {
  type         = "number"
  name         = "memory"
  display_name = "Memory (GiB)"
  description  = "Memory for your workspace"
  default      = "4"
  mutable      = true
  order        = 2
  validation {
    min = 1
    max = 32
  }
}

data "coder_parameter" "storage" {
  type         = "number"
  name         = "storage"
  display_name = "Storage (GiB)"
  description  = "Persistent disk size"
  default      = "10"
  mutable      = false
  order        = 3
  validation {
    min = 5
    max = 100
  }
}

data "coder_parameter" "repo" {
  type         = "string"
  name         = "repo"
  display_name = "Git Repository (optional)"
  description  = "Repo to auto-clone on workspace start"
  default      = "https://github.com/wonderingtribe/psychic-octo-fishstick"
  mutable      = true
  order        = 4
}

locals {
  workspace_name = "coder-${lower(data.coder_workspace.me.id)}"
  owner_name     = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)
  owner_email    = data.coder_workspace_owner.me.email
}

resource "kubernetes_persistent_volume_claim_v1" "workspaces" {
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

resource "kubernetes_deployment_v1" "main" {
  count = data.coder_workspace.me.start_count

  depends_on = [kubernetes_persistent_volume_claim_v1.workspaces]

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
        container {
          name              = "ide"
          image             = var.ide_image
          image_pull_policy = "IfNotPresent"

          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          env {
            name  = "PORT"
            value = "8080"
          }
          env {
            name  = "WS_DIR"
            value = "/home/coder/project"
          }
          env {
            name  = "GIT_AUTHOR_NAME"
            value = local.owner_name
          }
          env {
            name  = "GIT_AUTHOR_EMAIL"
            value = local.owner_email
          }
          env {
            name  = "GIT_COMMITTER_NAME"
            value = local.owner_name
          }
          env {
            name  = "GIT_COMMITTER_EMAIL"
            value = local.owner_email
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

        affinity {
          pod_anti_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 1
              pod_affinity_term {
                topology_key = "kubernetes.io/hostname"
                label_selector {
                  match_expressions {
                    key      = "app.kubernetes.io/name"
                    operator = "In"
                    values   = ["coder-workspace"]
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

resource "coder_agent" "main" {
  arch           = data.coder_provisioner.me.arch
  os             = "linux"
  dir            = "/home/coder/project"
  startup_script = <<-EOT
    #!/bin/bash
    set -e

    # Clone repo if set and directory is empty
    REPO="${data.coder_parameter.repo.value}"
    if [ -n "$REPO" ] && [ ! -d /home/coder/project/.git ]; then
      git clone "$REPO" /home/coder/project 2>/dev/null || true
    fi

    # Ensure project directory exists
    mkdir -p /home/coder/project

    # Set up git config
    git config --global user.name "${local.owner_name}"
    git config --global user.email "${local.owner_email}"
    git config --global init.defaultBranch main

    echo "Workspace ready for ${local.owner_name}!"
  EOT

  env = {
    GIT_AUTHOR_NAME     = local.owner_name
    GIT_AUTHOR_EMAIL    = local.owner_email
    GIT_COMMITTER_NAME  = local.owner_name
    GIT_COMMITTER_EMAIL = local.owner_email
  }

  metadata {
    display_name = "CPU"
    key          = "0_cpu"
    script       = "coder stat cpu"
    interval     = 10
    timeout      = 1
  }
  metadata {
    display_name = "Memory"
    key          = "1_mem"
    script       = "coder stat mem"
    interval     = 10
    timeout      = 1
  }
  metadata {
    display_name = "Disk"
    key          = "2_disk"
    script       = "coder stat disk --path /home/coder/project"
    interval     = 60
    timeout      = 1
  }
}

module "vscode-web" {
  count   = data.coder_workspace.me.start_count
  source  = "registry.coder.com/modules/vscode-web/coder"
  version = "1.0.21"

  agent_id       = coder_agent.main.id
  accept_license = true
  folder         = "/home/coder/project"
  extensions = [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-playwright.playwright",
    "eamodio.gitlens"
  ]
  auto_install_extensions = true
  order                   = 1
}

output "workspace_url" {
  description = "URL to access your workspace"
  value       = "${var.coder_url}/@${coder_agent.main.id}"
}

output "workspace_id" {
  description = "Workspace ID"
  value       = data.coder_workspace.me.id
}

output "workspace_owner" {
  description = "Workspace owner"
  value       = local.owner_name
}