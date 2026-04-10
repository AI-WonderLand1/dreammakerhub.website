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
    envbuilder = {
      source  = "coder/envbuilder"
      version = "~> 1.0"
    }
  }
}

# Coder provider - connects to your Coder control plane
provider "coder" {
  url = var.coder_url
}

# Kubernetes provider - connects to OKE cluster
provider "kubernetes" {
  config_path            = var.use_kubeconfig ? "~/.kube/config" : null
  host                   = var.use_kubeconfig ? null : var.k8s_host
  token                  = var.use_kubeconfig ? null : var.k8s_token
  cluster_ca_certificate = var.use_kubeconfig ? null : base64decode(var.k8s_ca_cert)
}

provider "envbuilder" {}

# Coder data sources
data "coder_provisioner" "me" {}
data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# Variables
variable "use_kubeconfig" {
  type        = bool
  description = "Use local kubeconfig for K8s auth? Set to false when running on Coder server in OKE."
  default     = false
}

variable "k8s_host" {
  type        = string
  description = "Kubernetes API server URL (for in-cluster auth)"
  default     = ""
}

variable "k8s_token" {
  type        = string
  description = "Kubernetes service account token (for in-cluster auth)"
  sensitive   = true
  default     = ""
}

variable "k8s_ca_cert" {
  type        = string
  description = "Kubernetes CA certificate (base64 encoded)"
  default     = ""
}

variable "coder_url" {
  type        = string
  description = "Coder server URL"
  default     = "http://coder:7080"
}

variable "namespace" {
  type        = string
  description = "Kubernetes namespace for workspaces"
  default     = "wonderland-workspaces"
}

variable "oci_registry" {
  type        = string
  description = "Oracle Cloud Infrastructure Registry URL (e.g., iad.ocir.io/tenancy/wonderspace)"
}

variable "cache_repo" {
  type        = string
  description = "OCI registry for build cache (e.g., iad.ocir.io/tenancy/wonderspace/cache)"
  default     = ""
}

variable "insecure_cache_repo" {
  type        = bool
  description = "Use HTTP instead of HTTPS for cache repo"
  default     = false
}

variable "cache_repo_dockerconfig_secret" {
  type        = string
  description = "K8s secret name containing .dockerconfigjson for OCIR auth"
  default     = ""
}

# Workspace resource parameters
data "coder_parameter" "cpu" {
  type         = "number"
  name         = "cpu"
  display_name = "CPU Cores"
  description  = "Number of CPU cores for the workspace"
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
  description  = "Memory allocation for the workspace"
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
  description  = "Persistent storage for /workspaces"
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
  display_name = "Git Repository"
  description  = "Repository to clone (optional)"
  default      = ""
  mutable      = true
  order        = 4
}

data "coder_parameter" "dotfiles_repo" {
  type         = "string"
  name         = "dotfiles_repo"
  display_name = "Dotfiles Repository"
  description  = "Repository containing your dotfiles (optional)"
  default      = ""
  mutable      = true
  order        = 5
}

# Fetch OCIR credentials if provided
data "kubernetes_secret_v1" "cache_repo_dockerconfig_secret" {
  count = var.cache_repo_dockerconfig_secret == "" ? 0 : 1
  metadata {
    name      = var.cache_repo_dockerconfig_secret
    namespace = var.namespace
  }
}

locals {
  # Unique workspace name based on Coder workspace ID and owner
  workspace_name            = "coder-${lower(data.coder_workspace.me.id)}"
  workspace_owner           = data.coder_workspace_owner.me.name
  workspace_owner_email     = data.coder_workspace_owner.me.email
  workspace_owner_full_name = coalesce(data.coder_workspace_owner.me.full_name, data.coder_workspace_owner.me.name)

  # Envbuilder configuration
  envbuilder_image = "ghcr.io/coder/envbuilder:1.0.0" # Pinned version

  # Environment variables for the workspace container
  envbuilder_env = {
    "CODER_AGENT_TOKEN"               = coder_agent.main.token
    "CODER_AGENT_URL"                 = replace(data.coder_workspace.me.access_url, "/localhost|127\\.0\\.0\\.1/", "host.docker.internal")
    "ENVBUILDER_GIT_URL"              = data.coder_parameter.repo.value != "" ? data.coder_parameter.repo.value : ""
    "ENVBUILDER_INIT_SCRIPT"          = replace(coder_agent.main.init_script, "/localhost|127\\.0\\.0\\.1/", "host.docker.internal")
    "ENVBUILDER_FALLBACK_IMAGE"       = "${var.oci_registry}/workspace:latest"
    "ENVBUILDER_CACHE_REPO"           = var.cache_repo != "" ? var.cache_repo : ""
    "ENVBUILDER_PUSH_IMAGE"           = var.cache_repo != "" ? "true" : "false"
    "ENVBUILDER_INSECURE"             = var.insecure_cache_repo ? "true" : "false"
    "ENVBUILDER_DOCKER_CONFIG_BASE64" = base64encode(try(data.kubernetes_secret_v1.cache_repo_dockerconfig_secret[0].data[".dockerconfigjson"], ""))
    "ENVBUILDER_WORKSPACE_FOLDER"     = "/workspaces"
    # Auto-setup scripts for Codespaces-like experience
    "POST_START_COMMAND" = fileexists("${path.module}/post-start.sh") ? file("${path.module}/post-start.sh") : ""
  }
}

# Check for cached image if cache_repo is configured
resource "envbuilder_cached_image" "cached" {
  count         = var.cache_repo == "" ? 0 : data.coder_workspace.me.start_count
  builder_image = local.envbuilder_image
  git_url       = data.coder_parameter.repo.value
  cache_repo    = var.cache_repo
  extra_env     = local.envbuilder_env
  insecure      = var.insecure_cache_repo
}

# Persistent Volume Claim for workspace storage
resource "kubernetes_persistent_volume_claim_v1" "workspaces" {
  metadata {
    name      = "${local.workspace_name}-workspaces"
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"       = "${local.workspace_name}-workspaces"
      "app.kubernetes.io/instance"   = "${local.workspace_name}-workspaces"
      "app.kubernetes.io/part-of"    = "coder"
      "app.kubernetes.io/managed-by" = "terraform"
      "com.coder.resource"           = "true"
      "com.coder.workspace.id"       = data.coder_workspace.me.id
      "com.coder.workspace.name"     = data.coder_workspace.me.name
      "com.coder.user.id"            = data.coder_workspace_owner.me.id
      "com.coder.user.username"      = data.coder_workspace_owner.me.name
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
    }
  }

  wait_until_bound = false

  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "${data.coder_parameter.storage.value}Gi"
      }
    }
    # Uncomment to specify storage class
    # storage_class_name = "oci-bv"
  }
}

# Kubernetes Deployment for the workspace
resource "kubernetes_deployment_v1" "main" {
  count = data.coder_workspace.me.start_count

  depends_on = [kubernetes_persistent_volume_claim_v1.workspaces]

  wait_for_rollout = false

  metadata {
    name      = local.workspace_name
    namespace = var.namespace
    labels = {
      "app.kubernetes.io/name"       = "coder-workspace"
      "app.kubernetes.io/instance"   = local.workspace_name
      "app.kubernetes.io/part-of"    = "coder"
      "app.kubernetes.io/managed-by" = "terraform"
      "com.coder.resource"           = "true"
      "com.coder.workspace.id"       = data.coder_workspace.me.id
      "com.coder.workspace.name"     = data.coder_workspace.me.name
      "com.coder.user.id"            = data.coder_workspace_owner.me.id
      "com.coder.user.username"      = data.coder_workspace_owner.me.name
      "wonderspace.workspace.type"   = "private-ide"
    }
    annotations = {
      "com.coder.user.email" = data.coder_workspace_owner.me.email
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

    strategy {
      type = "Recreate"
    }

    template {
      metadata {
        labels = {
          "app.kubernetes.io/name"     = "coder-workspace"
          "app.kubernetes.io/instance" = local.workspace_name
        }
      }

      spec {
        service_account_name = "coder-workspace"

        container {
          name              = "workspace"
          image             = var.cache_repo == "" ? local.envbuilder_image : envbuilder_cached_image.cached[0].image
          image_pull_policy = "IfNotPresent"

          # Environment variables - use cached env if available
          dynamic "env" {
            for_each = nonsensitive(var.cache_repo == "" ? local.envbuilder_env : envbuilder_cached_image.cached[0].env_map)
            content {
              name  = env.key
              value = env.value
            }
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
            mount_path = "/workspaces"
            name       = "workspaces"
          }

          # Health check
          liveness_probe {
            http_get {
              path = "/healthz"
              port = 8080
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/healthz"
              port = 8080
            }
            initial_delay_seconds = 10
            period_seconds        = 5
          }
        }

        volume {
          name = "workspaces"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.workspaces.metadata[0].name
          }
        }

        # Spread workspaces across nodes for better resource distribution
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

# Coder Agent - manages the workspace lifecycle
data "coder_workspace_owner" "me" {}

resource "coder_agent" "main" {
  arch           = data.coder_provisioner.me.arch
  os             = "linux"
  dir            = "/workspaces"
  startup_script = <<-EOT
    #!/bin/bash
    set -e
    
    # Create user directory if it doesn't exist
    mkdir -p /workspaces/${local.workspace_owner}
    
    # Set up git configuration
    git config --global user.name "${local.workspace_owner_full_name}"
    git config --global user.email "${local.workspace_owner_email}"
    git config --global init.defaultBranch main
    
    # Run dotfiles if provided
    if [ -n "${data.coder_parameter.dotfiles_repo.value}" ]; then
      echo "Installing dotfiles from ${data.coder_parameter.dotfiles_repo.value}..."
      curl -fsSL https://raw.githubusercontent.com/coder/dotfiles/main/install.sh | bash -s -- ${data.coder_parameter.dotfiles_repo.value}
    fi
    
    # Run post-start script if it exists
    if [ -f /workspaces/post-start.sh ]; then
      echo "Running post-start script..."
      bash /workspaces/post-start.sh
    fi
    
    echo "Workspace ready for ${local.workspace_owner}!"
  EOT

  # Git configuration
  env = {
    GIT_AUTHOR_NAME     = local.workspace_owner_full_name
    GIT_AUTHOR_EMAIL    = local.workspace_owner_email
    GIT_COMMITTER_NAME  = local.workspace_owner_full_name
    GIT_COMMITTER_EMAIL = local.workspace_owner_email
  }

  # Metadata for the dashboard
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
    display_name = "Workspaces Disk"
    key          = "2_workspaces_disk"
    script       = "coder stat disk --path /workspaces"
    interval     = 60
    timeout      = 1
  }

  metadata {
    display_name = "CPU Usage (Host)"
    key          = "3_cpu_usage_host"
    script       = "coder stat cpu --host"
    interval     = 10
    timeout      = 1
  }

  metadata {
    display_name = "Memory Usage (Host)"
    key          = "4_mem_usage_host"
    script       = "coder stat mem --host"
    interval     = 10
    timeout      = 1
  }
}

# VS Code in browser
module "code-server" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/modules/code-server/coder"
  version  = "1.0.23"
  agent_id = coder_agent.main.id
  order    = 1
}

# Terminal access
module "terminal" {
  count    = data.coder_workspace.me.start_count
  source   = "registry.coder.com/modules/jetbrains-gateway/coder"
  version  = "1.0.0"
  agent_id = coder_agent.main.id
  order    = 2
}

# Output the workspace access URL
output "workspace_url" {
  description = "URL to access the workspace"
  value       = coder_agent.main.url
}

output "workspace_id" {
  description = "Workspace ID"
  value       = data.coder_workspace.me.id
}

output "workspace_owner" {
  description = "Workspace owner username"
  value       = local.workspace_owner
}
