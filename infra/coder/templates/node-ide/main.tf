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

    # install node (if not in base image)
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    # clone user repo
    git clone "${var.repo_url}" /home/coder/workspace
    cd /home/coder/workspace

    # start code-server
    curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone --prefix=/tmp/code-server
    /tmp/code-server/bin/code-server --auth none --port 13337 --host 0.0.0.0 &
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
    url = "http://localhost:13337/healthz"
  }
}
