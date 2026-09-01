#!/usr/bin/env node
/**
 * One-time migration: splits the giant BLOCKS catalog out of
 * apps/web/lib/builder/components/ComponentLibrary.tsx into per-category
 * files under apps/web/lib/builder/blocks/, plus a barrel + shared utils.
 *
 * Before rewriting anything, it verifies the regenerated merged catalog is
 * byte-identical in content (same blocks, same order) to the source array.
 */
import fs from 'node:fs';
import path from 'node:path';

const COMPONENT_PATH = 'apps/web/lib/builder/components/ComponentLibrary.tsx';
const BLOCKS_DIR = 'apps/web/lib/builder/blocks';

const src = fs.readFileSync(COMPONENT_PATH, 'utf8');
const lines = src.split('\n');

// ── 1. Locate the BLOCKS array body ──────────────────────────────────────
const blocksStart = lines.findIndex((l) => l.trim().startsWith('export const BLOCKS'));
if (blocksStart === -1) throw new Error('Could not find BLOCKS export');
// body starts after `export const BLOCKS: BlockDefinition[] = [`
let bodyStart = blocksStart + 1;
// walk to the line containing the closing `];`
let bodyEnd = -1;
let depth = 0;
for (let i = bodyStart; i < lines.length; i++) {
  const ob = (lines[i].match(/\{/g) || []).length;
  const cb = (lines[i].match(/\}/g) || []).length;
  depth += ob - cb;
  if (depth === 0 && lines[i].trim() === '];') {
    bodyEnd = i;
    break;
  }
}
if (bodyEnd === -1) throw new Error('Could not find BLOCKS closing bracket');

const body = lines.slice(bodyStart, bodyEnd);

// ── 2. Group block lines by category ─────────────────────────────────────
const CATEGORY_RE = /category:\s*'([a-z-]+)'/;
const groups = new Map(); // category -> lines[]
const blockLines = [];
let totalBlocks = 0;

for (const ln of body) {
  if (!ln.includes('name:')) continue; // skip banner comments / blank lines
  const m = ln.match(CATEGORY_RE);
  if (!m) throw new Error(`Block line has no category: ${ln.slice(0, 80)}`);
  const cat = m[1];
  if (!groups.has(cat)) groups.set(cat, []);
  groups.get(cat).push(ln);
  blockLines.push(ln);
  totalBlocks += 1;
}

const categoryOrder = [...groups.keys()];

// ── 3. Verify: re-serialize merged catalog === source block lines ────────
const joined = categoryOrder.flatMap((cat) => groups.get(cat));
if (joined.length !== blockLines.length) {
  throw new Error('Block count mismatch after grouping');
}
for (let i = 0; i < joined.length; i++) {
  if (joined[i] !== blockLines[i]) {
    throw new Error(`Order/content drift at block #${i}: ${joined[i].slice(0, 60)}`);
  }
}
console.log(`OK: ${totalBlocks} blocks across ${categoryOrder.length} categories (${categoryOrder.join(', ')})`);

// ── 4. Write per-category files ──────────────────────────────────────────
fs.mkdirSync(BLOCKS_DIR, { recursive: true });

const header = `import type { BlockDefinition } from '../types';\n\n`;
for (const cat of categoryOrder) {
  const constName = `${cat.toUpperCase().replace(/-/g, '_')}_BLOCKS`;
  const catLines = groups.get(cat);
  const banner = `// ═══════════════════════════════════════\n// ${cat.toUpperCase()}\n// ═══════════════════════════════════════`;
  const content = `${header}export const ${constName}: BlockDefinition[] = [\n${banner}\n${catLines.join('\n')}\n];\n`;
  fs.writeFileSync(path.join(BLOCKS_DIR, `${cat}.ts`), content);
}

// ── 5. Write the barrel ──────────────────────────────────────────────────
const importLines = categoryOrder
  .map((cat) => `import { ${cat.toUpperCase().replace(/-/g, '_')}_BLOCKS } from './${cat}';`)
  .join('\n');
const merged = categoryOrder
  .map((cat) => `  ...${cat.toUpperCase().replace(/-/g, '_')}_BLOCKS,`)
  .join('\n');
const barrel = `import type { BlockDefinition } from '../types';\n${importLines}\n\n` +
  `export const BLOCKS: BlockDefinition[] = [\n${merged}\n];\n\n` +
  `export { BLOCK_CATEGORIES } from './categories';\n` +
  categoryOrder.map((cat) => `export { ${cat.toUpperCase().replace(/-/g, '_')}_BLOCKS } from './${cat}';`).join('\n') +
  `\nexport * from './utils';\n`;
fs.writeFileSync(path.join(BLOCKS_DIR, 'index.ts'), barrel);

// ── 6. Write categories.ts (BLOCK_CATEGORIES) ────────────────────────────
const catsStart = lines.findIndex((l) => l.trim().startsWith('export const BLOCK_CATEGORIES'));
if (catsStart === -1) throw new Error('Could not find BLOCK_CATEGORIES export');
const catsLines = [lines[catsStart], ...lines.slice(catsStart + 1)];
const catsEndIdx = catsLines.findIndex((l) => l.trim() === '];');
const catsBody = catsLines.slice(0, catsEndIdx + 1);
fs.writeFileSync(
  path.join(BLOCKS_DIR, 'categories.ts'),
  `import type { BlockCategory } from '../types';\n\n${catsBody.join('\n')}\n`
);

console.log('Wrote per-category files + barrel + categories.ts to', BLOCKS_DIR);
