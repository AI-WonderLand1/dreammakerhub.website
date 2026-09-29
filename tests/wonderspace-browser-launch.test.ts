import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace launch-safe browser IDE', () => {
  const browser = read('apps/web/app/wonderspace/browser/page.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const dashboard = read('apps/web/app/(workspace)/dashboard/page.tsx');
  const filesPage = read('apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx');
  const filesApi = read('apps/web/app/api/projects/[projectId]/files/route.ts');
  const projectApi = read('apps/web/app/api/projects/route.ts');

  it('requires authenticated project discovery, never lists operator files', () => {
    expect(browser).toContain('supabase.auth.getUser()');
    expect(browser).toContain("fetch('/api/projects'");
    expect(browser).toContain('Array.isArray(result?.projects)');
    expect(browser).toContain("setState('signin')");
    expect(projectApi).toContain('requirePaidAIUser(req)');
    expect(filesApi).toContain('requirePaidAIUser(');
    expect(browser).not.toContain('CODER_API_TOKEN');
    expect(browser).not.toContain('coder.dreammakerhub.website');
  });

  it('creates a real project via authenticated persistence before opening the editor', () => {
    expect(browser).toContain("method: 'POST'");
    expect(browser).toContain("JSON.stringify({ name: name.trim(), type: 'workspace' })");
    expect(browser).toContain('typeof result?.project?.id');
    expect(browser).toContain("router.push('/dashboard/projects/'");
    expect(projectApi).toContain('await createProject(userId');
    expect(filesPage).toContain('<RepositoryFileBrowser');
  });

  it('offers the browser editor to both customer and operator without enabling Coder pods', () => {
    expect(gate).toContain('href="/wonderspace/browser"');
    expect(gate).toContain('<BrowserIdeEntry />');
    expect(gate).toContain('<CloudIdePaused />');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
    expect(gate).not.toContain('CustomerWorkspaceLaunch');
    expect(dashboard).toContain('label: "Browser IDE"');
    expect(dashboard).toContain('/dashboard/projects/');
    expect(browser).toContain('a Linux terminal and isolated cloud runtime are not included');
    expect(browser).toContain('does not automatically sync');
    expect(browser).not.toContain('/api/user-workspace/customer/provision');
  });
});
