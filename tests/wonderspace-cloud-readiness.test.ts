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

  it('keeps Railway customer UI off until server flags and remote controller health agree', () => {
    expect(page).toContain('async function railwayCustomerPilot()');
    expect(page).toContain('WONDERSPACE_CUSTOMER_RUNTIME_ENABLED');
    expect(page).toContain('NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED');
    expect(page).toContain('WONDERSPACE_CONTROLLER_URL');
    expect(page).toContain('status?.runtimeEnabled === true');
    expect(page).toContain('const customerPilot = await railwayCustomerPilot()');
    expect(release).toContain('WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID');
    expect(release).toContain('WONDERSPACE_PRIVATE_NETWORK_REVIEWED');
    expect(controller).toContain('assertSafeControllerEnvironment(process.env)');
    // Older Coder customer queue exists for compatibility, but isn't exposed
    // as the new customer launch path and remains independently fail-closed.
    expect(backend).toContain('await assertFreshUsageController()');
    expect(backend).toContain('await verifiedCustomerTemplateId()');
    expect(backend).toContain('await verifiedCustomerCoderOwner(user)');
  });

  it('offers immediate browser editing without exposing the shared operator IDE', () => {
    expect(gate).toContain('function CloudIdePaused()');
    expect(gate).toContain('href="/dashboard?workspaceTab=code"');
    expect(gate).toContain('href="/wonderspace/browser"');
    expect(gate).toContain('<CloudIdePaused />');
    expect(gate).toContain('customerPilot ? <CustomerSandboxIdeEntry />');
    expect(gate).not.toContain('CustomerWorkspaceLaunch');
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
  });
});
