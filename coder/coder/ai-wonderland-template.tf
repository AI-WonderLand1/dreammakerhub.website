terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

data "coder_provisioner" "me" {}

data "coder_workspace" "me" {}

# AI Wonderland specific environment
resource "coder_agent" "main" {
  arch = data.coder_provisioner.me.arch
  os   = data.coder_provisioner.me.os

  # AI Wonderland project setup
  startup_script = <<-EOF
    #!/bin/bash
    set -e
    
    # Clone AI Wonderland project
    if [ ! -d "ai-wonderland" ]; then
      git clone https://github.com/dreammakerhub/ai-wonderland.git
    fi
    
    cd ai-wonderland
    
    # Install dependencies
    npm install
    
    # Build the project
    npm run build
    
    echo "🎪 AI Wonderland workspace ready!"
    echo "Run 'npm run dev' to start development server"
  EOF

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
}

# AI Wonderland specific environment variables
resource "coder_env" "ai_wonderland_vars" {
  agent_id   = coder_agent.main.id
  agent_name = "main"
  
  name  = "AI_WONDERLAND_WORKSPACE"
  value = "true"
  
  name  = "NODE_ENV"
  value = "development"
}

# VS Code for development
module "code-server" {
  count  = data.coder_workspace.me.start_count
  source = "registry.coder.com/coder/code-server/coder"
  version = "~> 1.0"

  agent_id   = coder_agent.main.id
  agent_name = "main"
  
  # AI Wonderland specific extensions
  extensions = [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss", 
    "ms-playwright.playwright",
    "esbenp.prettier-vscode"
  ]
}

# Development ports
resource "coder_app" "ai_wonderland_dev" {
  agent_id     = coder_agent.main.id
  name         = "AI Wonderland Dev"
  url          = "http://localhost:3000"
  icon         = "/icon/rocket.svg"
  subdomain    = false
  share        = "owner"
}

resource "coder_app" "code_server" {
  agent_id     = coder_agent.main.id
  name         = "VS Code"
  url          = "http://localhost:8080"
  icon         = "/icon/code.svg"
  subdomain    = true
  share        = "owner"
}