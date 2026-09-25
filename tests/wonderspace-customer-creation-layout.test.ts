import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace customer creation layout', () => {
  const form = read('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const provision = read('apps/web/app/api/user-workspace/customer/provision/route.ts');

  it('keeps a single-page quick-start and Codespaces-style setup layout without GitHub branding', () => {
    expect(form).toContain('Quick start templates');
    expect(form).toContain('Create a new workspace');
    for (const row of ['Workspace name', 'Repository', 'Branch', 'Region', 'Machine type']) {
      expect(form).toContain(row);
    }
    expect(form).toContain('Blank Linux');
    expect(form).not.toContain('GitHub Codespaces');
  });

  it('does not pretend repository, branch, region or future starter templates are live', () => {
    expect(form).toContain('Repository import needs an approved customer template first');
    expect(form).toContain('Not applicable to blank workspace');
    expect(form).toContain('Automatic');
    expect(form).toContain('aria-disabled="true"');
    expect(form).toContain('Import planned');
  });

  it('only submits the approved server-side customer form fields', () => {
    expect(form).toContain("fetch('/api/user-workspace/customer/provision'");
    expect(form).toContain('JSON.stringify({ workspaceName, machineProfile })');
    expect(provision).toContain('queueCustomerWorkspace(user, input)');
    expect(form).not.toContain('/api/user-workspace/customer/open/');
    expect(form).not.toContain('coder.dreammakerhub.website');
  });

  it('renders an inert operator preview and an honest paused customer screen', () => {
    expect(form).toContain('const provisioningPaused = operatorPreview || !provisioningEnabled');
    expect(form).toContain('disabled={loading || provisioningPaused}');
    expect(form).toContain('if (operatorPreview || !provisioningEnabled)');
    expect(gate).toContain('<CustomerWorkspaceLaunch operatorPreview embedded />');
    expect(gate).toContain('<CustomerWorkspaceLaunch provisioningEnabled={false} />');
    expect(gate).toContain("if (role === 'customer' && customerPilot)");
    expect(gate).not.toContain('href="/dashboard"');
  });

  it('preserves the operator IDE path without letting customers inherit it', () => {
    expect(gate).toContain('Open / start production IDE');
    expect(gate).toContain('isOperator'); // Operator identity is determined by the separate server check.
    expect(form).toContain('you will not be sent to the Coder dashboard');
  });
});
