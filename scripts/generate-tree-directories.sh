#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/tree-directories.md"

cd "$ROOT"

python - <<'PY' > "$OUT"
from pathlib import Path
root=Path('.').resolve()
ignore={'node_modules','.next','dist','.git','coverage'}
max_depth=3

def walk(path, prefix='', depth=0):
    if depth>max_depth:
        return []
    entries=[p for p in sorted(path.iterdir(), key=lambda p:(not p.is_dir(), p.name.lower())) if p.name not in ignore]
    lines=[]
    for i,p in enumerate(entries):
        last=i==len(entries)-1
        branch='└── ' if last else '├── '
        lines.append(prefix+branch+p.name)
        if p.is_dir() and depth<max_depth:
            ext='    ' if last else '│   '
            lines.extend(walk(p,prefix+ext,depth+1))
    return lines

print('# Repository Directory Overview')
print('')
print('> Auto-generated. Do not edit by hand.')
print('')
print('```')
print('.')
for line in walk(root, '', 0):
    print(line)
print('```')
PY

echo "Updated $OUT"
