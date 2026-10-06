import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace customer creation layout', () => {
  const form = read('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const provision = read('apps/web/app/api/user-workspace/customer/provision/route.ts');
  const customerQueue = read('apps/web/lib/coder/customer-provisioning.server.ts');

  it('keeps one simple creation screen with safe defaults and advanced naming', () => {
    expect(form).toContain('Create a new workspace');
    expect(form).toContain('Start from');
    expect(form).toContain('Advanced options · Change workspace name');
    expect(form).toContain("useState<WorkspaceProfileId>('micro')");
    for (const row of ['Workspace name', 'Choose a source', 'Machine type']) {
      expect(form).toContain(row);
    }
    expect(form).toContain('Blank Linux');
    expect(form).not.toContain('Quick start templates');
    expect(form.indexOf('id="workspace-source"')).toBeLessThan(form.indexOf('htmlFor="customer-machine-profile"'));
    expect(form.indexOf('htmlFor="customer-machine-profile"')).toBeLessThan(form.indexOf('Advanced options · Change workspace name'));
    expect(form).toContain('name="workspaceName" minLength={3}');
    expect(form).not.toContain('GitHub Codespaces');
  });

  it('restricts GitHub to a future user-authorized connection without public repository inspection', () => {
    expect(form).toContain('My AI WONDERLAND projects');
    expect(form).toContain('My GitHub repositories');
    expect(form).toContain('separate, account-authorized GitHub connection');
    expect(form).toContain('Files on my computer');
    expect(form).toContain('siteProjectHref(selectedSiteProject)');
    expect(form).toContain('id="workspace-source"');
    expect(form).toContain('Manage workspaces');
    expect(form).toContain("source !== 'blank'");
    expect(form).not.toContain('Public GitHub repository');
    expect(form).not.toContain('https://github.com/');
    expect(form).not.toContain('public-github-repo');
    expect(form).not.toContain('inspectPublicRepo');
    expect(form).not.toContain('github.com');
    expect(form).not.toContain('Automatic region assignment');
    expect(form).not.toContain('>Region</span>');
    expect(existsSync(join(process.cwd(), 'apps/web/app/api/user-workspace/customer/repository/route.ts'))).toBe(false);
  });

  it('only submits the approved server-side customer form fields', () => {
    expect(form).toContain("fetch('/api/user-workspace/customer/provision'");
    expect(form).toContain('JSON.stringify({ workspaceName, machineProfile })');
    expect(provision).toContain('queueCustomerWorkspace(user, input)');
    expect(customerQueue).toContain('Only an approved blank IDE');
    expect(form).toContain('/api/user-workspace/customer/open/');
    expect(form).toContain('Open private IDE');
    expect(form).not.toContain('coder.dreammakerhub.website');
  });

  it('renders the gated customer form on its dedicated route without changing the operator gate', () => {
    expect(form).toContain('const provisioningPaused = operatorPreview || !provisioningEnabled');
    expect(form).toContain("disabled={loading || provisioningPaused || source !== 'blank'}");
    expect(form).toContain('if (operatorPreview || !provisioningEnabled)');
    expect(gate).toContain('function BrowserIdeEntry()');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
    expect(gate).not.toContain('CustomerWorkspaceLaunch');
    expect(gate).toContain('href="/dashboard?workspaceTab=code#projects"');
    const customerPage = read('apps/web/app/wonderspace/create/page.tsx');
    expect(customerPage).toContain('<CustomerWorkspaceLaunch');
    expect(customerPage).toContain('CODER_CUSTOMER_PROVISIONING_ENABLED');
    expect(customerPage).toContain('CODER_WILDCARD_ACCESS_URL');
  });

  it('preserves the operator IDE path without letting customers inherit it', () => {
    expect(gate).toContain('Open / start production IDE');
    expect(gate).toContain('isOperator'); // Operator identity is determined by the separate server check.
    expect(form).toContain('siteProjectHref(selectedSiteProject)');
  });
});
