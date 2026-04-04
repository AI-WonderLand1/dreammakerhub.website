data "coder_external_auth" "github" {
  id = "github"
}

resource "coder_agent" "main" {
  arch           = "amd64"
  os             = "linux"
  startup_script = <<EOT
    # 1. Clone the repo using the token from Coder's OAuth
    git clone https://$${data.coder_external_auth.github.access_token}@github.com/wonderingtribe/psychic-octo-fishstick.git
    
    # 2. Enter the folder
    cd psychic-octo-fishstick

    # 3. Start the IDE (standard for Coder)
    code-server --auth none --port 13337
  EOT
}
