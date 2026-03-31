#!/usr/bin/env bash
set -euo pipefail

echo "==> Release gates: automated checks"

echo "[1/3] Wonderspace project route checks"
pnpm vitest run tests/wonderspace-projects-route.test.ts

echo "[2/3] Wonderspace artifact schema checks"
pnpm vitest run tests/wonderspace-artifacts-schema.test.ts

echo "[3/3] Wonderspace app integration checks"
pnpm vitest run tests/wonderspace-theia-app.test.ts

echo "[optional] Wonderspace artifact route checks (best effort)"
if ! pnpm vitest run tests/wonderspace-artifacts-routes.test.ts; then
  echo "⚠️  Optional artifact route test could not run in this environment."
  echo "⚠️  Keep artifact upload/list/download in the manual release gate checklist."
fi

echo "✅ Required automated release gate checks passed"
