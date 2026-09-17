# The template must be published to Coder before its new parameters become usable.
# Only public GitHub repositories are supported until per-user Git authentication exists.
data "coder_parameter" "repo_url" {
  name         = "repo_url"
  display_name = "Public GitHub repository"
  description  = "Optional public GitHub HTTPS clone URL"
  type         = "string"
  default      = ""
  mutable      = false
  validation {
    regex = "^$|^https://github[.]com/[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9._-]{1,100}([.]git)?$"
    error = "Enter a public https://github.com/owner/repository URL or leave blank."
  }
}

data "coder_parameter" "repo_branch" {
  name         = "repo_branch"
  display_name = "Repository branch"
  description  = "Optional branch to check out; defaults to the repository's default branch"
  type         = "string"
  default      = ""
  mutable      = false
  validation {
    regex = "^$|^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$"
    error = "Enter a valid branch name or leave blank."
  }
}

resource "coder_script" "clone_public_repository" {
  agent_id           = coder_agent.main.id
  display_name       = "Clone public repository"
  icon               = "/icon/git.svg"
  run_on_start       = true
  start_blocks_login = true
  timeout            = 180
  script = <<-EOT
    #!/bin/sh
    set -eu
    repo_url="${data.coder_parameter.repo_url.value}"
    repo_branch="${data.coder_parameter.repo_branch.value}"
    [ -n "$repo_url" ] || exit 0

    case "$repo_url" in
      https://github.com/*) ;;
      *) echo "Only public GitHub HTTPS repositories are supported"; exit 1 ;;
    esac
    target=/home/coder/wonderspace
    mkdir -p "$target"
    if [ -d "$target/.git" ]; then
      echo "Existing repository preserved; not overwriting workspace files."
      exit 0
    fi
    if [ -n "$(ls -A "$target")" ]; then
      echo "Workspace directory contains files; refusing to overwrite them."
      exit 1
    fi
    if [ -n "$repo_branch" ]; then
      git clone --depth 1 --single-branch --branch "$repo_branch" -- "$repo_url" "$target"
    else
      git clone --depth 1 -- "$repo_url" "$target"
    fi
    echo "Public GitHub repository cloned into WonderSpace."
  EOT
}
