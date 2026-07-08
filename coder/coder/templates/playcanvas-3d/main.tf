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
  default     = "coder"
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
  default      = "2"
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
}

data "coder_parameter" "memory" {
  name         = "memory"
  display_name = "Memory"
  description  = "Memory in GB (max 8)"
  default      = 4
  type         = "number"
  icon         = "/icon/memory.svg"
  mutable      = true
  validation {
    min = 1
    max = 8
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
  default      = "20"
  type         = "number"
  icon         = "/emojis/1f4be.png"
  mutable      = false
  validation {
    min = 5
    max = 50
  }
}

resource "coder_agent" "main" {
  os             = "linux"
  arch           = "amd64"
  startup_script = <<-EOT
    set -e

    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    # Install code-server for file editing
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone --prefix=/tmp/code-server

    # Generate SSH key for user isolation
    mkdir -p /home/coder/.ssh
    ssh-keygen -t ed25519 -f /home/coder/.ssh/id_ed25519 -N "" -C "wonderplay-$(whoami)@pod" 2>/dev/null || true
    cat /home/coder/.ssh/id_ed25519.pub >> /home/coder/.ssh/authorized_keys 2>/dev/null || true
    chmod 700 /home/coder/.ssh
    chmod 600 /home/coder/.ssh/*

    # Start SSH daemon
    service ssh start 2>/dev/null || /usr/sbin/sshd 2>/dev/null || true

    # Set up PlayCanvas project
    mkdir -p /home/coder/wonderplay
    cd /home/coder/wonderplay
    npm init -y
    npm install playcanvas express

    # Create server to serve PlayCanvas editor
    cat > /home/coder/wonderplay/server.js << 'SERVEREOF'
    const express = require('express');
    const path = require('path');
    const app = express();
    const PORT = 31000;

    app.use(express.static(path.join(__dirname, 'node_modules/playcanvas/build')));
    app.use('/editor', express.static(path.join(__dirname, 'node_modules/playcanvas/editor')));

    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>WonderPlay 3D Editor</title></head>
        <body style="margin:0;background:#1a1a2e;color:white;font-family:sans-serif">
          <div id="app" style="width:100vw;height:100vh"></div>
          <script src="/playcanvas-stable.min.js"></script>
          <script>
            const canvas = document.createElement('canvas');
            canvas.id = 'application-canvas';
            canvas.style.cssText = 'width:100%;height:100%';
            document.getElementById('app').appendChild(canvas);
          </script>
        </body>
        </html>
      `);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`WonderPlay 3D Editor running on port ${PORT}`);
    });
    SERVEREOF

    # Start PlayCanvas editor
    nohup node /home/coder/wonderplay/server.js > /tmp/playcanvas.log 2>&1 &

    # Start code-server for file editing
    nohup /tmp/code-server/bin/code-server --auth none --port 13337 --host 0.0.0.0 > /tmp/code-server.log 2>&1 &

    # Log ready
    echo "✅ WonderPlay 3D Editor ready on port 31000, code-server on 13337"
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

resource "coder_app" "playcanvas" {
  agent_id     = coder_agent.main.id
  slug         = "playcanvas"
  display_name = "WonderPlay 3D Editor"
  icon         = "/icon/playcanvas.svg"
  url          = "http://localhost:31000"
  subdomain    = false
  share        = "owner"

  healthcheck {
    url       = "http://localhost:31000"
    interval  = 5
    threshold = 10
  }
}

resource "coder_app" "code_server" {
  agent_id     = coder_agent.main.id
  slug         = "code-server"
  display_name = "code-server"
  icon         = "/icon/code.svg"
  url          = "http://localhost:13337?folder=/home/coder/wonderplay"
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
          image_pull_policy = "Always"
          command           = ["sh", "-c", coder_agent.main.init_script]
          security_context {
            run_as_user = "1000"
          }
          env {
            name  = "CODER_AGENT_TOKEN"
            value = coder_agent.main.token
          }
          resources {
            requests = {
              "cpu"    = "500m"
              "memory" = "1Gi"
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
