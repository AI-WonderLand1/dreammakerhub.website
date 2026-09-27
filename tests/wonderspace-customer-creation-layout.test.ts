import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace customer creation layout', () => {
  const form = read('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const provision = read('apps/web/app/api/user-workspace/customer/provision/route.ts');
  const repoPreview = read('apps/web/app/api/user-workspace/customer/repository/route.ts');
  const customerQueue = read('apps/web/lib/coder/customer-provisioning.server.ts');

  it('keeps a single-page quick-start and Codespaces-style setup layout without GitHub branding', () => {
    expect(form).toContain('Quick start templates');
    expect(form).toContain('Create a new workspace');
    for (const row of ['Workspace name', 'Source: where will your code come from?', 'Branch (read-only preview)', 'Machine type']) {
      expect(form).toContain(row);
    }
    expect(form).toContain('Blank Linux');
    expect(form).not.toContain('GitHub Codespaces');
  });

  it('distinguishes real site projects, public GitHub inspection and unconnected local upload', () => {
    expect(form).toContain('My DreamMakerHub projects');
    expect(form).toContain('Public GitHub repository');
    expect(form).toContain('Files on my computer');
    expect(form).toContain('Inspect repository');
    expect(form).toContain('View this repository’s CI');
    expect(form).toContain('siteProjectHref(selectedSiteProject)');
    expect(form).toContain('if (requestId !== repoRequestId.current) return;');
    expect(form).toContain('repoRequestId.current += 1');
    expect(form).not.toContain('Automatic region assignment');
    expect(form).not.toContain('>Region</span>');
    expect(form).toContain('id="workspace-source"');
    expect(form).toContain('aria-disabled="true"');
    expect(form).toContain('Inspecting is not importing.');
    expect(form).toContain("provisioningPaused ? 'Choose a source' : 'Create workspace'");
    expect(form).toContain('Manage existing workspaces');
    expect(form).toContain("source !== 'blank'");
  });

  it('only submits the approved server-side customer form fields', () => {
    expect(form).toContain("fetch('/api/user-workspace/customer/provision'");
    expect(form).toContain('JSON.stringify({ workspaceName, machineProfile })');
    expect(provision).toContain('queueCustomerWorkspace(user, input)');
    expect(customerQueue).toContain('Only an approved blank IDE');
    expect(repoPreview).toContain('authenticatedSupabaseUser(request)');
    expect(repoPreview).toContain('normalizePublicGithubRepo(raw)');
    expect(repoPreview).toContain('importAvailable: false');
    expect(repoPreview).not.toContain('queueCustomerWorkspace(');
    expect(repoPreview).not.toContain('createWorkspace(');
    expect(form).not.toContain('/api/user-workspace/customer/open/');
    expect(form).not.toContain('coder.dreammakerhub.website');
  });

  it('renders an inert operator preview and an honest paused customer screen', () => {
    expect(form).toContain('const provisioningPaused = operatorPreview || !provisioningEnabled');
    expect(form).toContain("disabled={loading || provisioningPaused || source !== 'blank'}");
    expect(form).toContain('if (operatorPreview || !provisioningEnabled)');
    expect(gate).toContain('<CustomerWorkspaceLaunch operatorPreview embedded />');
    expect(gate).toContain('<CustomerWorkspaceLaunch provisioningEnabled={false} />');
    expect(gate).toContain("if (role === 'customer' && customerPilot)");
    expect(gate).not.toContain('href="/dashboard"');
  });

  it('preserves the operator IDE path without letting customers inherit it', () => {
    expect(gate).toContain('Open / start production IDE');
    expect(gate).toContain('isOperator'); // Operator identity is determined by the separate server check.
    expect(form).toContain('siteProjectHref(selectedSiteProject)');
    expect(form).toContain('if (requestId !== repoRequestId.current) return;');
    expect(form).toContain('repoRequestId.current += 1');
  });
});
