import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const appRoot = join(root, 'apps/web/app');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function routeFor(file: string): string {
  const rel = relative(appRoot, file).replaceAll('\\', '/');
  const withoutLeaf = rel.replace(/\/(page|route)\.(tsx?|jsx?)$/, '');
  const segments = withoutLeaf
    .split('/')
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));
  return '/' + segments.join('/');
}

describe('DreamMakerHub route integrity', () => {
  it('does not define duplicate Next.js page or API URLs', () => {
    const routeFiles = walk(appRoot).filter((file) => /\/(page|route)\.(tsx?|jsx?)$/.test(file));
    const byRoute = new Map<string, string[]>();

    for (const file of routeFiles) {
      const route = routeFor(file);
      byRoute.set(route, [...(byRoute.get(route) ?? []), relative(root, file)]);
    }

    const collisions = [...byRoute.entries()].filter(([, files]) => files.length > 1);
    expect(collisions).toEqual([]);
  });

  it('keeps the 3D AI generator inside the authenticated workspace shell', () => {
    expect(existsSync(join(appRoot, '(workspace)/dashboard/ai-generator/page.tsx'))).toBe(true);
    expect(existsSync(join(appRoot, 'dashboard/ai-generator/page.tsx'))).toBe(false);
  });

  it('does not restore the unused legacy dashboard sidebar', () => {
    expect(existsSync(join(root, 'apps/web/components/dashboard/Sidebar.tsx'))).toBe(false);
  });
});
