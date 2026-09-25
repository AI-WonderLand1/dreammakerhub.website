import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'apps/web/lib/projects/storage.ts'), 'utf8');
const start = source.indexOf('export async function ensureDefaultProject(');
const end = source.indexOf('\nasync function assertOwner(', start);
const implementation = source.slice(start, end);

describe('default project storage must fail honestly', () => {
  it('returns a real existing or newly created project', () => {
    expect(implementation).toContain('const existing = await listProjects(ownerId);');
    expect(implementation).toContain('if (existing.length > 0) return existing[0];');
    expect(implementation).toContain('return createProject(ownerId, name);');
  });

  it('does not invent an ID or swallow database failures', () => {
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(implementation).not.toContain('catch');
    expect(implementation).not.toContain('project-${ownerId}');
  });
});
