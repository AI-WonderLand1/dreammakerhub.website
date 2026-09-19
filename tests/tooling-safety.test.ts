import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rootPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  scripts: Record<string, string>;
};
const ciWorkflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

describe('safe repository maintenance commands', () => {
  it('keeps the default lint command non-mutating', () => {
    expect(rootPackage.scripts.lint).not.toMatch(/(?:^|\s)--fix(?:\s|$)/);
    expect(rootPackage.scripts['lint:fix']).toMatch(/(?:^|\s)--fix(?:\s|$)/);
    expect(rootPackage.scripts['clean:ghosts']).toContain('npm run lint');
  });

  it('uses the committed dependency lockfile in CI', () => {
    expect(ciWorkflow).toMatch(/run:\s*npm ci\b/);
    expect(ciWorkflow).not.toMatch(/run:\s*npm install\b/);
  });
});
