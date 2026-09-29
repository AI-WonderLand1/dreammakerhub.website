import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Cloud IDE launch safety', () => {
  const page = read('apps/web/app/wonderspace/page.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const backend = read('apps/web/lib/coder/customer-provisioning.server.ts');

  it('does not present a customer creation wizard based on a single unsafe flag', () => {
    expect(page).toContain('function customerCreationUiReady()');
    for (const flag of [
      'CODER_CUSTOMER_PROVISIONING_ENABLED',
      'CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED',
      'CODER_CUSTOMER_HARD_STOP_VERIFIED',
      'CODER_SUPABASE_OIDC_VERIFIED',
      'BILLABLE_OPERATIONS_ENABLED',
      'CODER_WORKSPACE_CREATION_ENABLED',
      'CODER_CUSTOMER_TEMPLATE_VERSION_ID',
      'CODER_OPERATOR_USER_ID',
      'CODER_CUSTOMER_RUNNER_SECRET',
    ]) expect(page).toContain(flag);
    expect(page).toContain('const customerPilot = customerCreationUiReady()');
    expect(backend).toContain('await assertFreshUsageController()');
    expect(backend).toContain('await verifiedCustomerTemplateId()');
    expect(backend).toContain('await verifiedCustomerCoderOwner(user)');
  });

  it('makes the no-cloud alternative obvious without sharing the operator IDE', () => {
    expect(gate).toContain('function CloudIdePaused()');
    expect(gate).toContain('href="/dashboard?workspaceTab=code"');
    expect(gate).toContain('href="/wonderspace/browser"');
    expect(gate).toContain('<CloudIdePaused />');
    expect(gate).not.toContain('<CustomerWorkspaceLaunch provisioningEnabled={false} />');
    expect(gate).not.toContain('<CustomerWorkspaceLaunch operatorPreview embedded />');
    expect(gate).toContain('if (role === \'operator\') return <OperatorIdePanel');
    expect(gate).toContain("if (role === 'customer' && customerPilot)");
  });
});
