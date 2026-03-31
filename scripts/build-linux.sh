#!/bin/bash

# Define your paths
UE_PATH="/path/to/your/UnrealEngine"
PROJECT_PATH="$GITHUB_WORKSPACE/path/to/your/project.uproject"
OUTPUT_PATH="$GITHUB_WORKSPACE/Build/Output"

# Run the Unreal Automation Tool (UAT)
"$UE_PATH/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun \
    -project="$PROJECT_PATH" \
    -noP4 -clientconfig=Development -serverconfig=Development \
    -nocompileeditor -build -cook -stage -package -archive \
    -archivedirectory="$OUTPUT_PATH" \
    -targetplatform=Linux \
    -utf8output
