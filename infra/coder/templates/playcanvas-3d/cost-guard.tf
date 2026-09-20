# Fail a Coder plan from any entry point if it would bypass resource quotas.
resource "terraform_data" "workspace_cost_guard" {
  input = data.coder_workspace.me.id
  lifecycle {
    precondition {
      condition     = var.namespace == "coder-workspaces"
      error_message = "Workspaces must run in quota-controlled coder-workspaces namespace."
    }
    precondition {
      condition     = tonumber(data.coder_parameter.cpu.value) >= 1 && tonumber(data.coder_parameter.cpu.value) <= 2
      error_message = "PlayCanvas workspaces are capped at 2 CPU cores."
    }
    precondition {
      condition     = tonumber(data.coder_parameter.memory.value) >= 1 && tonumber(data.coder_parameter.memory.value) <= 4
      error_message = "PlayCanvas workspaces are capped at 4 GiB RAM."
    }
    precondition {
      condition     = tonumber(data.coder_parameter.home_disk_size.value) == 10
      error_message = "PlayCanvas workspaces require an exactly 10 GiB persistent disk."
    }
  }
}
