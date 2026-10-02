import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace direct project files flow', () => {
  const browser = read('apps/web/app/wonderspace/browser/page.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const dashboard = read('apps/web/app/(workspace)/dashboard/page.tsx');
  const filesPage = read('apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx');
  const filesApi = read('apps/web/app/api/projects/[projectId]/files/route.ts');

  it('retires the duplicate browser project picker', () => {
    expect(browser).toContain("wonderSpaceProjectFiles");
    expect(browser).toContain("WONDERSPACE_CODE_HOME");
    expect(browser).not.toContain("fetch('/api/projects'");
    expect(browser).not.toContain('Create and open editor');
  });

  it('sends customers to projects instead of another IDE landing page', () => {
    expect(gate).toContain("router.replace('/dashboard?workspaceTab=code#projects')");
    expect(gate).toContain('href="/dashboard?workspaceTab=code#projects"');
    expect(gate).not.toContain('CloudIdePaused');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
  });

  it('opens code projects directly in the native file manager', () => {
    expect(dashboard).toContain('return "Code / Files"');
    expect(dashboard).toContain('label: "Files"');
    expect(dashboard).toContain('"Open files"');
    expect(dashboard).not.toContain('CoderAvailabilityIndicator');
    expect(filesPage).toContain('<RepositoryFileBrowser');
    expect(filesApi).toContain('requirePaidAIUser(');
  });
});
