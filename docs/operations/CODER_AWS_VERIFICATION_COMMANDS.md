# Read-only AWS/Coder verification for operator

Run these only from an AWS VM with a configured, authorized kubeconfig; do not paste tokens, kubeconfig, private keys, or full environment files in chat or issues.

```bash
kubectl config current-context
kubectl get nodes -o wide
kubectl get namespaces
kubectl get deployment,pods,svc,pvc -n coder -o wide
kubectl get resourcequota,limitrange -n coder
kubectl get storageclass
```

If Kubernetes is not installed or the context points somewhere else, stop and identify the actual host. Separately check Coder's active template in the authenticated Coder UI and the website's running server config. Do not interpret the AWS web fallback Docker deploy as an IDE cluster. Avoid `kubectl apply`, `terraform apply`, new AWS nodes, workspace creates or `coder templates push` until the running system and costs are reviewed. Existing `wonderingtribe/production` data must be left untouched.
