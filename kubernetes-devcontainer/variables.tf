variable "use_kubeconfig" {
  description = "Use local kubeconfig for authentication? Set false when running in-cluster"
  type        = bool
  default     = false
}

variable "k8s_host" {
  description = "Kubernetes API server host"
  type        = string
  default     = ""
}

variable "k8s_token" {
  description = "Kubernetes service account token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "k8s_ca_cert" {
  description = "Kubernetes CA certificate (base64)"
  type        = string
  default     = ""
}

variable "coder_url" {
  description = "Coder server URL"
  type        = string
  default     = "https://coder.wonderland.com"
}

variable "namespace" {
  description = "Kubernetes namespace for workspaces"
  type        = string
  default     = "wonderland-workspaces"
}

variable "oci_registry" {
  description = "Oracle Container Registry URL"
  type        = string
}

variable "cache_repo" {
  description = "Registry for build caching"
  type        = string
  default     = ""
}

variable "insecure_cache_repo" {
  description = "Use HTTP for cache repo"
  type        = bool
  default     = false
}

variable "cache_repo_dockerconfig_secret" {
  description = "K8s secret with dockerconfigjson"
  type        = string
  default     = ""
}
