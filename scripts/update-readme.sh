#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STRUCTURE_FILE="$ROOT/STRUCTURE.txt"
README="$ROOT/README.md"

cd "$ROOT"

echo "📂 Generating project structure..."
tree -L 4 -I "node_modules|.next|dist|.git" > "$STRUCTURE_FILE"

echo "📝 Updating README.md..."

# Remove old Project Structure section if it exists
sed -i '/^## Project Structure/,$d' "$README" 2>/dev/null || true

# Append fresh structure
cat >> "$README" <<EOF

## Project Structure

\`\`\`
$(cat "$STRUCTURE_FILE")
\`\`\`
EOF

echo "✅ README.md updated successfully."
