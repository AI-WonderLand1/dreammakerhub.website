# Coder Server Configuration
coder_url = "https://dreammakerhub.website"

# Kubernetes Configuration
use_kubeconfig = false
k8s_host       = "https://163.192.205.55:6443"
k8s_token      = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImdncExiSVVVdThnOVUxend3YXhrd19yV3hUb0NDV0VLdHRlZHdzWWxMd3MifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImFkbWluLXVzZXItdG9rZW4iLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiYWRtaW4tdXNlciIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjRjNWEzMTZkLTE0YzMtNDNlZC1hOWU5LWQxZGQ0NDFlYjZhOSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmFkbWluLXVzZXIifQ.SeeF91P2BsIK02aQNPHRsyRCiJED1wMFCl_Y_WB9MrO8U_UwuycmKZaSJyhAJZOD7Qu9n6HogbyGr60_GgPyJdZQhXFJmIRFeSVb9IyEAvPvVODMsF-V0VHBYYA6Pa62Yzd__KFKhjVfcnoYgd_2OWup53k8yqNPX-61ieU-buXT9shgJEy2Tq05Y7pytz86LfLdjqzrwfJuSsHub82e8Ugs9JnXSZOnBvgVYR0MF9AX4id8XfjHSkMRju-XJbOsDyemw5AxyTuncZqNOKqwMayxVbTA8Wie5M54Zxq8UeA6HZDwyMOEAFuDlMekhtOeSKlp0yL7FJAgemhT5TLKOA"
k8s_ca_cert    = ""

# OCI Registry Configuration
namespace                      = "wonderland-workspaces"
oci_registry                   = "iad.ocir.io/axgejcaos4uw/wonderspace"
cache_repo                     = "iad.ocir.io/axgejcaos4uw/wonderspace/cache"
cache_repo_dockerconfig_secret = "ocir-cred"
insecure_cache_repo            = false
