# Coder Server Configuration
coder_url = "https://coder.yourdomain.com"

# Kubernetes Configuration
use_kubeconfig = false
k8s_host       = "https://163.192.205.55:6443"
k8s_token      = ""
k8s_ca_cert    = ""

# OCI Registry Configuration
namespace                      = "wonderland-workspaces"
oci_registry                   = "iad.ocir.io/axgejcaos4uw/wonderspace"
cache_repo                     = "iad.ocir.io/axgejcaos4uw/wonderspace/cache"
cache_repo_dockerconfig_secret = "ocir-cred"
insecure_cache_repo            = false
