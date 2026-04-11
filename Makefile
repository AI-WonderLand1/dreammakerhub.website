HELM_NAMESPACE := external-secrets
CHART_DIR := ./bin/chart/external-secrets

.PHONY: helm.build helm.install helm.uninstall helm.upgrade helm.validate

helm.build:
	@mkdir -p bin/chart
	helm repo add external-secrets https://charts.external-secrets.io --quiet || true
	helm repo update external-secrets
	helm pull external-secrets/external-secrets -d ./bin/chart --untar

helm.install:
	helm install external-secrets $(CHART_DIR) \
		-n $(HELM_NAMESPACE) \
		--create-namespace \
		--set installCRDs=true

helm.upgrade:
	helm upgrade external-secrets $(CHART_DIR) \
		-n $(HELM_NAMESPACE) \
		--set installCRDs=true \
		--wait

helm.uninstall:
	helm uninstall external-secrets -n $(HELM_NAMESPACE)

helm.validate:
	@kubectl get pods -n $(HELM_NAMESPACE) -l app.kubernetes.io/name=external-secrets
	@kubectl get crd -l app.kubernetes.io/name=external-secrets | grep -q "externalsecrets" && echo "CRDs installed" || echo "CRDs missing"