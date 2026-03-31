#!/bin/bash
# Description: Builds the Unreal project using the official Docker image.

# 1. Define paths relative to the root of your monorepo
# Run this script from the root of 'ai-wonderland'
WORKSPACE_ROOT=$(pwd)
UPROJECT_REL_PATH="Test/ViridianCo.uproject"
ARCHIVE_REL_PATH="Archive"

echo "Starting Unreal Engine 5.4 Docker Build..."
echo "Mounting Workspace: $WORKSPACE_ROOT"

# 2. Execute the Docker container
# --rm : Removes the container after the build is done
# -v   : Mounts your local workspace to /project inside the container
# /home/ue4/... : The absolute path to RunUAT.sh INSIDE the Epic Linux container

docker run --rm \
  -v "$WORKSPACE_ROOT:/project" \
  ghcr.io/epicgames/unreal-engine:dev-5.4 \
  /home/ue4/UnrealEngine/Engine/Build/BatchFiles/RunUAT.sh BuildCookRun \
  -project="/project/$UPROJECT_REL_PATH" \
  -platform=Linux \
  -clientconfig=Shipping \
  -serverconfig=Shipping \
  -cook \
  -build \
  -stage \
  -pak \
  -archive \
  -archivedirectory="/project/$ARCHIVE_REL_PATH" \
  -utf8output

if [ $? -eq 0 ]; then
    echo "✅ Build Successful! Check the '$ARCHIVE_REL_PATH' folder for your packaged game."
else
    echo "❌ Build Failed. Check the UAT logs above."
fi
