import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const dashboard = read('apps/web/app/(workspace)/dashboard/page.tsx');
const manager = read('apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx');
const browser = read('apps/web/app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser.tsx');
const filesApi = read('apps/web/app/api/projects/[projectId]/files/route.ts');

describe('VM-independent dashboard file manager access', () => {
  it('has a visible direct file manager entry and supports a new user's project creation', () => {
    expect(dashboard).toContain('File Manager');
    expect(dashboard).toContain('(no VM)');
    expect(dashboard).toContain('/dashboard/projects/${mostRecentProject.id}/files');
    expect(dashboard).toContain('onClick={openCreate}');
  });

  it('reports project load failures rather than silently pretending there are zero files', () => {
    expect(dashboard).toContain('!projectsResponse.ok');
    expect(dashboard).toContain('!Array.isArray(data.projects)');
    expect(dashboard).toContain('role="alert"');
    expect(dashboard).toContain('Retry loading projects');
    expect(dashboard).toContain('setProjectReloadKey((key) => key + 1)');
  });

  it('uses the existing authenticated Supabase project file editor, not a Coder VM', () => {
    expect(manager).toContain('<RepositoryFileBrowser');
    expect(browser).toContain('<CodeEditor');
    expect(browser).toContain('files/rename');
    expect(browser).toContain('/files');
    expect(filesApi).toContain('requirePaidAIUser');
    expect(filesApi).toContain("from '@/lib/projects/storage'");
    expect(manager).not.toContain('coderApiRequest');
  });
});
