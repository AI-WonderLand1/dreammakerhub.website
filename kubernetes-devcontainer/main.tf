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

provider "kubernetes" {
  config_path = "~/.kube/config"
}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

# --- CUSTOMER INPUTS ---

data "coder_parameter" "repo" {
  name         = "repo"
  display_name = "Project Repository"
  description  = "The Git URL of the project you want to load."
  type         = "string"
  default      = ""
  mutable      = true
  order        = 1
}

data "coder_parameter" "cpu" {
  name         = "cpu"
  display_name = "CPU Cores"
  type         = "number"
  default      = 2
  mutable      = true
  order        = 2
  validation {
    min = 1
    max = 8
  }
}

data "coder_parameter" "memory" {
  name         = "memory"
  display_name = "Memory (GB)"
  type         = "number"
  default      = 4
  mutable      = true
  order        = 3
  validation {
    min = 1
    max = 32
  }
}

# --- THE AGENT (THE BRAIN) ---

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"
  dir  = "/home/coder/project"
  
  startup_script = <<-EOT
    #!/bin/bash
    set -e
    
    # Clean the terminal view
    echo "" > /etc/motd
    echo "Initializing your Wonderspace Environment..."

    # Create project directory
    mkdir -p /home/coder/project

    # Clone the repo if the customer provided one
    if [ -n "${data.coder_parameter.repo.value}" ]; then
      echo "Cloning ${data.coder_parameter.repo.value}..."
      git clone "${data.coder_parameter.repo.value}" /home/coder/project || true
    fi

    echo "Ready!"
  EOT

  metadata {
    display_name = "CPU Usage"
    key          = "cpu"
    script       = "coder stat cpu"
    interval     = 10
  }

  metadata {
    display_name = "RAM Usage"
    key          = "mem"
    script       = "coder stat mem"
    interval     = 10
  }
}

# --- THE APP (THE BUTTON ON YOUR SITE) ---

resource "coder_app" "ide" {
  agent_id     = coder_agent.main.id
  slug         = "ide"
  display_name = "Launch Studio"
  icon         = "/icon/code.svg"
  url          = "http://localhost:8080" 
  subdomain    = true
  share        = "owner"
}

# --- KUBERNETES INFRASTRUCTURE ---

locals {
  dns_name = lower(data.coder_workspace.me.name)
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "pvc-${local.dns_name}"
    namespace = "coder"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "10Gi"
      }
    }
  }
}

resource "kubernetes_deployment_v1" "main" {
  count      = data.coder_workspace.me.start_count
  depends_on = [kubernetes_persistent_volume_claim_v1.home]

  metadata {
    name      = "env-${local.dns_name}"
    namespace = "coder"
  }

  spec {
    replicas = 1
    selector {
      match_labels = { "env-id" = data.coder_workspace.me.id }
    }
    template {
      metadata {
        labels = { "env-id" = data.coder_workspace.me.id }
      }
      spec {
        security_context {
          run_as_user     = 1000
          fs_group        = 1000
          run_as_non_root = true
        }

        container {
          name    = "studio"
          image   = "wonderspace/ide:latest"
          command = ["sh", "-c", coder_agent.main.init_script]
          
          resources {
            limits = {
              cpu    = "${data.coder_parameter.cpu.value}"
              memory = "${data.coder_parameter.memory.value}Gi"
            }
          }

          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          
          volume_mount {
            mount_path = "/home/coder/project"
            name       = "project-data"
          }
        }

        volume {
          name = "project-data"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.home.metadata[0].name
          }
        }
      }
    }
  }
}
