#!/usr/bin/env bash
set -euo pipefail

TARGETS=("apps/web/app" "engine" "ui" "infra" "workers" "types" "hooks" "config" "tests" "scripts")
FILES=$(git ls-files "${TARGETS[@]}" | grep -E '\.(ts|tsx|js|jsx)$' || true)

[ -z "$FILES" ] && echo "No files found" && exit 0

# @/components/... -> @components/... (compat alias points to ui/components)
perl -pi -e 's#from\s+([\"\x27])@/components/#from $1\@components/#g' $FILES

# @/lib/... -> @lib/...
perl -pi -e 's#from\s+([\"\x27])@/lib/#from $1\@lib/#g' $FILES

# @/services/... -> @services/...
perl -pi -e 's#from\s+([\"\x27])@/services/#from $1\@services/#g' $FILES

# @/core/... -> @core/...
perl -pi -e 's#from\s+([\"\x27])@/core/#from $1\@core/#g' $FILES

echo "Done. Review: git diff"
