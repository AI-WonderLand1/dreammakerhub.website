import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Cloud IDE launch safety', () => {
  const page = read('apps/web/app/wonderspace/page.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const controller = read('infra/wonderspace/customer-controller/server.mjs');
  const release = read('infra/wonderspace/customer-controller/release-gates.mjs');
  const backend = read('apps/web/lib/coder/customer-provisioning.server.ts');

  it('removes the undeployed Railway customer entry but keeps legacy backend safety gates', () => {
    expect(page).not.toContain('railwayCustomerPilot');
    expect(page).toContain('WonderSpaceOperatorGate');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
    expect(release).toContain('WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID');
    expect(controller).toContain('assertSafeControllerEnvironment(process.env)');
    expect(backend).toContain('await assertFreshUsageController()');
    expect(backend).toContain('await verifiedCustomerTemplateId()');
    expect(backend).toContain('await verifiedCustomerCoderOwner(user)');
  });

  it('offers immediate browser editing without exposing the shared operator IDE', () => {
    expect(gate).toContain('function CloudIdePaused()');
    expect(gate).toContain('href="/dashboard?workspaceTab=code"');
    expect(gate).toContain('href="/wonderspace/browser"');
    expect(gate).toContain('<CloudIdePaused />');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
    expect(gate).not.toContain('CustomerWorkspaceLaunch');
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
  });
});
