#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  tree)
    ls -la
    ;;
  cat)
    shift
    cat "$@"
    ;;
  find)
    shift
    rg -n "$@" .
    ;;
  routes)
    rg -n "export async function (GET|POST|PUT|PATCH|DELETE)" app -S
    ;;
  publish)
    rg -n "publishId|published" app -S
    ;;
  middleware)
    cat middleware.ts
    ;;
  *)
    echo "Usage:"
    echo "  scripts/devtool.sh tree"
    echo "  scripts/devtool.sh cat <file>"
    echo "  scripts/devtool.sh find <pattern>"
    echo "  scripts/devtool.sh routes"
    echo "  scripts/devtool.sh publish"
    echo "  scripts/devtool.sh middleware"
    exit 1
    ;;
esac
