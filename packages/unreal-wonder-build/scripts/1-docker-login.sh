#!/bin/bash
# Description: Logs into the GitHub Container Registry to access Epic's UE5 images.

echo "Retrieving GitHub Container Registry credentials..."

# You should set CR_PAT as an environment variable or GitHub Action Secret.
# e.g., export CR_PAT="ghp_your_personal_access_token_here"
# OR export CR_PAT=$ANTICHEAT_PRIVATE_KEY (if you repurpose your secrets)

if [ -z "$CR_PAT" ]; then
  echo "Error: CR_PAT environment variable is not set."
  echo "Please export your GitHub Personal Access Token (with read:packages scope)."
  echo "Usage: export CR_PAT=\"ghp_xxx...\""
  exit 1
fi

echo "$CR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

if [ $? -eq 0 ]; then
    echo "Successfully logged in to ghcr.io"
    echo "Pulling the UE 5.4 Development Image (This will take a while...)"
    docker pull ghcr.io/epicgames/unreal-engine:dev-5.4
else
    echo "Docker login failed. Check your PAT and Epic Games account link."
fi
