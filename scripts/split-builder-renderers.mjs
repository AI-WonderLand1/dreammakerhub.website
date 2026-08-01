#!/usr/bin/env node
/**
 * One-time migration: extracts the renderElement switch (130 cases) out of
 * apps/web/lib/builder/components/VisualBuilderCanvas.tsx into per-category
 * renderer files under apps/web/lib/builder/renderers/.
 *
 * Each case body keeps the exact original statements, wrapped as
 *   'heading': ({ el, selectedId, selectElement, baseProps, children }) => { ... },
 * so rendering behavior is unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';

const CANVAS_PATH = 'apps/web/lib/builder/components/VisualBuilderCanvas.tsx';
const RENDERERS_DIR = 'apps/web/lib/builder/renderers';

const lines = fs.readFileSync(CANVAS_PATH, 'utf8').split('\n');
const si = lines.findIndex((l) => l.includes('switch (el.type)'));

// ── 1. Parse switch into case groups ─────────────────────────────────────
const groups = []; // { labels: string[], body: string[] }
let depth = 1;
let cur = null;
for (let i = si + 1; i < lines.length; i++) {
  const l = lines[i];
  const caseAll = [...l.matchAll(/case '([^']+)':/g)].map((m) => m[1]);
  const isDefault = depth === 1 && l.trim().startsWith('default:');
  if (depth === 1 && (caseAll.length > 0 || isDefault)) {
    // Consecutive case labels sharing one body merge into a single group.
    if (cur && cur.body.length === 0 && !cur.labels.includes('__default')) {
      cur.labels.push(...caseAll);
    } else {
      if (cur) groups.push(cur);
      cur = isDefault ? { labels: ['__default'], body: [] } : { labels: caseAll, body: [] };
    }
  } else if (cur) {
    cur.body.push(l);
  }
  const ob = (l.match(/\{/g) || []).length;
  const cb = (l.match(/\}/g) || []).length;
  depth += ob - cb;
  if (depth === 0 && l.trim() === '}') {
    if (cur) groups.push(cur);
    break;
  }
}

// ── 2. Build type → category map from the block catalog ──────────────────
const cats = fs
  .readdirSync('apps/web/lib/builder/blocks')
  .filter((f) => f.endsWith('.ts') && !['index.ts', 'categories.ts', 'utils.ts'].includes(f));
const typeToCat = {};
for (const c of cats) {
  const body = fs.readFileSync(path.join('apps/web/lib/builder/blocks', c), 'utf8');
  for (const m of body.matchAll(/type: '([^']+)'/g)) typeToCat[m[1]] = c.replace('.ts', '');
}
// Renderer-only alias labels that have no matching catalog entry.
const ALIAS_CATEGORY = {
  preformatted: 'typography',
  buttons: 'forms',
  separator: 'utility',
  step: 'blog',
  html: 'utility',
};
Object.assign(typeToCat, ALIAS_CATEGORY);

// ── 3. Map each label to a category; report unmapped ─────────────────────
const catGroups = new Map(); // category -> [{ labels, body }]
const miscGroups = [];
const seenLabels = new Set();
for (const g of groups) {
  if (g.labels.includes('__default')) continue;
  const cat = typeToCat[g.labels[0]];
  const allMapped = g.labels.every((t) => typeToCat[t]);
  if (cat && allMapped) {
    if (!catGroups.has(cat)) catGroups.set(cat, []);
    catGroups.get(cat).push(g);
  } else {
    miscGroups.push(g);
  }
  for (const t of g.labels) seenLabels.add(t);
}

console.log(`Renderer case groups: ${groups.length} (${seenLabels.size} labels)`);
console.log(`Per-category: ${[...catGroups.keys()].join(', ')}`);
console.log(`Unmapped/misc groups (${miscGroups.length}):`);
for (const g of miscGroups) console.log('  -', g.labels.join(','));

// ── 4. Emit shared types ─────────────────────────────────────────────────
fs.mkdirSync(RENDERERS_DIR, { recursive: true });
fs.writeFileSync(
  path.join(RENDERERS_DIR, 'types.ts'),
      `import type { ReactNode } from 'react';
import type { CanvasElement } from '../types';

export interface RendererCtx {
  el: CanvasElement;
  selectedId: string | null;
  selectElement: (id: string | null) => void;
  baseProps: Record<string, any>;
  style: Record<string, any>;
  children: ReactNode;
}

export type BlockRenderer = (ctx: RendererCtx) => ReactNode;
`
);

// ── 5. Emit per-category renderer files ──────────────────────────────────
const emitEntries = (groupList) =>
  groupList
    .map((g) => {
      const body = g.body.join('\n');
      return `  ${g.labels.map((t) => `'${t}'`).join(', ')}: ({ el, selectedId, selectElement, baseProps, style, children }) => {
${body}
  },`;
    })
    .join('\n');

for (const [cat, groupList] of catGroups) {
  const content = `import type { BlockRenderer } from './types';

export const ${cat}Renderers: Record<string, BlockRenderer> = {
${emitEntries(groupList)}
};
`;
  fs.writeFileSync(path.join(RENDERERS_DIR, `${cat}.tsx`), content);
}

if (miscGroups.length > 0) {
  fs.writeFileSync(
    path.join(RENDERERS_DIR, '_misc.tsx'),
    `import type { BlockRenderer } from './types';

export const miscRenderers: Record<string, BlockRenderer> = {
${emitEntries(miscGroups)}
};
`
  );
}

console.log('Wrote renderer files to', RENDERERS_DIR);
