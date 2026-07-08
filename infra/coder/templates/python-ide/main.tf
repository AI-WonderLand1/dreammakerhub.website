terraform {
  required_providers {
    coder = { source = "coder/coder", version = "~> 2.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 3.0" }
  }
}

provider "coder" {}
provider "kubernetes" {}

variable "repo_url" {
  description = "Git repo to clone"
  type        = string
}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  startup_script = <<-EOS
    #!/bin/bash
    set -e

    # install python & pip (if not in base image)
    apt-get update && apt-get install -y python3 python3-pip

    # clone user repo
    git clone "${var.repo_url}" /home/coder/workspace
    cd /home/coder/workspace

    # optional: install requirements.txt if present
    if [ -f requirements.txt ]; then
      pip3 install -r requirements.txt
    fi

    # start code-server (bound to localhost — Coder proxy handles auth)
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone --prefix=/tmp/code-server
    /tmp/code-server/bin/code-server --auth none --port 13337 --host 127.0.0.1 &
  EOS
}

resource "coder_app" "code_server" {
  agent_id = coder_agent.main.id
  slug     = "code-server"
  display_name = "Code Server"
  url      = "http://localhost:13337"
  subdomain = false
  share = "owner"
  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 10
  }
}
