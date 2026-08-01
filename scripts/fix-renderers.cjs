// Idempotent fixer for the generated renderer files.
// - Splits comma-joined object keys ('a', 'b': ...) into per-label entries.
// - Drops a stray block-scope closing brace left from `case 'x': {` patterns.
// - Rewrites the dynamic `Tag` cast to `as any` (JSX children typing fix).
// - Ensures ./shared import in utility.tsx.
const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'apps/web/lib/builder/renderers');
const NEEDLE = ": ({ el, selectedId, selectElement, baseProps, style, children }) => {";

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.tsx')) continue;
  const p = path.join(dir, file);
  const src = fs.readFileSync(p, 'utf8');
  let lines = src.split('\n');
  const out = [];
  let i = 0;
  let changed = false;
  while (i < lines.length) {
    const line = lines[i];
    const idx = line.indexOf(NEEDLE);
    const labelPart = idx > 0 ? line.slice(0, idx) : null;
    const labels = labelPart && labelPart.match(/'[a-z0-9-]+'/g);
    if (labels && labels.length > 1) {
      changed = true;
      const indent = labelPart.slice(0, labelPart.indexOf("'"));
      const header = NEEDLE;
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '},') { body.push(lines[i]); i++; }
      const closing = lines[i]; // "  },"
      // drop a trailing stray block-close brace if present in body
      if (body.length && /^\s{2,4}\}$/.test(body[body.length - 1]) && body[body.length - 1] !== '  }') {
        body.pop();
        // ensure the closing brace of body matches: original stray was 4-space
      }
      const bodyText = body.join('\n');
      for (const label of labels) {
        out.push(`${indent}${label}: (${header.slice(2)})`); // header starts with ": "
        out.push(bodyText);
        out.push(closing);
      }
      i++;
    } else {
      out.push(line);
      i++;
    }
  }
  let result = out.join('\n');

  // Fix typography dynamic Tag cast (any other file references bare JSX namespace).
  if (file === 'typography.tsx' && /as keyof JSX\.IntrinsicElements/.test(result)) {
    result = result.replace(/as keyof JSX\.IntrinsicElements/, 'as any');
    // ensure no stale explicit JSX namespace import
    result = result.replace(/import type \{ JSX \} from 'react';\n/, '');
    changed = true;
  }

  // Ensure utility.tsx imports the shared components.
  if (file === 'utility.tsx' && !result.includes("import { AccordionItem")) {
    result = result.replace(
      /import type \{ BlockRenderer \} from '\.\/types';/,
      "import type { BlockRenderer } from './types';\nimport { AccordionItem, TabsContainer } from './shared';"
    );
    changed = true;
  }

  if (changed) fs.writeFileSync(p, result);
  console.log(changed ? `FIXED ${file}` : `ok     ${file}`);
}
