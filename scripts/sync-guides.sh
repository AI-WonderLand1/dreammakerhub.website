#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Syncing root docs → docs/guides"

mkdir -p docs/guides

cp -f ARCHITECTURE.md docs/guides/architecture.md
cp -f CONTRIBUTING.md docs/guides/contributing.md
cp -f DEPLOYMENT.md   docs/guides/deployment.md

echo "✅ Docs synced"
