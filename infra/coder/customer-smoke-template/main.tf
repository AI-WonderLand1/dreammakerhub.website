# AWS CUSTOMER POD SMOKE TEST ONLY.
# This template proves that the new AWS Coder can create an isolated
# customer Deployment + PVC in coder-customers. Do not publish it as the
# production customer template.
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

# Use the authenticated Coder provisioner configuration; do not override its URL
# with an internal HTTP service unreachable under customer egress restrictions.
provider "coder" {}
provider "kubernetes" {}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  startup_script = <<-EOT
    set -eu
    mkdir -p /home/coder/wonderspace /tmp/code-server
    if ! command -v code-server >/dev/null 2>&1; then
      curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone --prefix=/tmp/code-server
      export PATH="/tmp/code-server/bin:$PATH"
    fi
    code-server --auth none --host 127.0.0.1 --port 13337 --app-name "WonderSpace" /home/coder/wonderspace >/tmp/code-server.log 2>&1 &
  EOT
}

resource "coder_app" "wonderspace" {
  agent_id     = coder_agent.main.id
  slug         = "wonderspace"
  display_name = "WonderSpace"
  url          = "http://localhost:13337/?folder=/home/coder/wonderspace"
  subdomain    = true
  share        = "owner"

  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 20
  }
}

resource "kubernetes_persistent_volume_claim_v1" "home" {
  metadata {
    name      = "customer-${data.coder_workspace.me.id}-home"
    namespace = "coder-customers"
    labels = {
      "com.coder.resource"     = "true"
      "com.coder.workspace.id" = data.coder_workspace.me.id
      "com.coder.user.id"      = data.coder_workspace_owner.me.id
      "dreammakerhub.smoke"    = "true"
    }
  }

  wait_until_bound = false

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
  count            = data.coder_workspace.me.start_count
  wait_for_rollout = false

  metadata {
    name      = "customer-${data.coder_workspace.me.id}"
    namespace = "coder-customers"
    labels = {
      "com.coder.resource"     = "true"
      "com.coder.workspace.id" = data.coder_workspace.me.id
      "com.coder.user.id"      = data.coder_workspace_owner.me.id
      "dreammakerhub.smoke"    = "true"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        "com.coder.workspace.id" = data.coder_workspace.me.id
      }
    }

    strategy {
      type = "Recreate"
    }

    template {
      metadata {
        labels = {
          "com.coder.workspace.id" = data.coder_workspace.me.id
          "com.coder.user.id"      = data.coder_workspace_owner.me.id
          "dreammakerhub.smoke"    = "true"
        }
      }

      spec {
        automount_service_account_token = false

        security_context {
          run_as_user     = 1000
          fs_group        = 1000
          run_as_non_root = true
          seccomp_profile {
            type = "RuntimeDefault"
          }
        }

        container {
          name              = "ide"
          image             = "codercom/enterprise-base:ubuntu"
          image_pull_policy = "IfNotPresent"
          command           = ["sh", "-c", coder_agent.main.init_script]

          security_context {
            run_as_user                = 1000
            run_as_non_root            = true
            allow_privilege_escalation = false
            capabilities {
              drop = ["ALL"]
            }
          }

          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }

          resources {
            requests = {
              cpu    = "250m"
              memory = "512Mi"
            }
            limits = {
              cpu    = "1"
              memory = "2Gi"
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
