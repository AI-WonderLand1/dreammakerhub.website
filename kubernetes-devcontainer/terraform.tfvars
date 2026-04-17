# Coder Server Configuration
coder_url = "https://dreammakerhub.website"

# Kubernetes Configuration (provider uses local kubeconfig from ~/.kube/config)
use_kubeconfig = true

# OCI Registry Configuration
namespace                      = "wonderland-workspaces"
oci_registry                   = "iad.ocir.io/axgejcaos4uw/wonderspace"
cache_repo                     = "iad.ocir.io/axgejcaos4uw/wonderspace/cache"
cache_repo_dockerconfig_secret = "ocir-cred"
insecure_cache_repo            = false
