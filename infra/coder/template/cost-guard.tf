# This must be evaluated even for workspaces launched directly from Coder's UI/CLI.
# App-level limits are not sufficient when a user can launch through Coder itself.
resource "terraform_data" "workspace_cost_guard" {
  input = data.coder_workspace.me.id
  lifecycle {
    precondition {
      condition     = var.namespace == "coder-workspaces"
      error_message = "Workspaces must run in the quota-controlled coder-workspaces namespace. Configure the template namespace variable before publishing."
    }
    precondition {
      condition     = tonumber(data.coder_parameter.cpu.value) >= 1 && tonumber(data.coder_parameter.cpu.value) <= 2
      error_message = "Coder workspaces are capped at 2 CPU cores."
    }
    precondition {
      condition     = tonumber(data.coder_parameter.memory.value) >= 1 && tonumber(data.coder_parameter.memory.value) <= 4
      error_message = "Coder workspaces are capped at 4 GiB RAM."
    }
    precondition {
      condition     = tonumber(data.coder_parameter.home_disk_size.value) == 10
      error_message = "Coder workspaces require an exactly 10 GiB persistent disk."
    }
  }
}
