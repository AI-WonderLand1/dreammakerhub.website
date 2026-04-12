REGISTRY ?= ghcr.io/wonderingtribe
IMAGE_NAME ?= wonderspace-ide
WORKSPACE_IMAGE_NAME ?= wonderspace-ide-workspace
TAG ?= latest

.PHONY: build workspace-image coder-image push clean

workspace-image:
	@echo "=== Step 1/2: Building workspace IDE image ==="
	docker build -t $(WORKSPACE_IMAGE_NAME):$(TAG) -f .devcontainer/Dockerfile ..
	@echo "=== Saving workspace image to tar ==="
	docker save $(WORKSPACE_IMAGE_NAME):$(TAG) -o Docker-image/workspace-image.tar

coder-image: workspace-image
	@echo "=== Step 2/2: Building Coder-in-a-box image ==="
	docker build -t $(IMAGE_NAME):$(TAG) -f Docker-image/Dockerfile Docker-image/

build: coder-image
	@echo ""
	@echo "============================================"
	@echo "  WonderSpace IDE built successfully!"
	@echo "============================================"
	@echo ""
	@echo "  Image: $(IMAGE_NAME):$(TAG)"
	@echo ""
	@echo "  To run locally:"
	@echo "    docker run -d --name wonderspace \\"
	@echo "      -p 7080:7080 \\"
	@echo "      -v /var/run/docker.sock:/var/run/docker.sock \\"
	@echo "      -v wonderspace-db:/var/lib/postgresql/data \\"
	@echo '      -e CODER_ACCESS_URL=http://localhost:7080 \\'
	@echo "      $(IMAGE_NAME):$(TAG)"
	@echo ""

push: build
	@echo "=== Pushing to registry ==="
	docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)

clean:
	@echo "=== Cleaning up ==="
	rm -f Docker-image/workspace-image.tar
	docker rmi $(WORKSPACE_IMAGE_NAME):$(TAG) 2>/dev/null || true
	docker rmi $(IMAGE_NAME):$(TAG) 2>/dev/null || true