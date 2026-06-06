#!/usr/bin/env bash
set -euo pipefail

echo "==> Release gates: automated checks"

echo "[1/1] Running all tests in tests/"
npx vitest run tests/

echo "✅ Required automated release gate checks passed"
