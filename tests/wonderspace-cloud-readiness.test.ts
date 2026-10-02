import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('WonderSpace customer cleanup', () => {
  const page = read('apps/web/app/wonderspace/page.tsx');
  const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const backend = read('apps/web/lib/coder/customer-provisioning.server.ts');

  it('keeps customer Coder provisioning fail closed while removing it from customer navigation', () => {
    expect(page).not.toContain('railwayCustomerPilot');
    expect(page).toContain('WonderSpaceOperatorGate');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
    expect(gate).not.toContain('CloudIdePaused');
    expect(gate).toContain("router.replace('/dashboard?workspaceTab=code#projects')");
    expect(backend).toContain('await assertFreshUsageController()');
    expect(backend).toContain('await verifiedCustomerTemplateId()');
    expect(backend).toContain('await verifiedCustomerCoderOwner(user)');
  });

  it('preserves the separately protected operator IDE', () => {
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
    expect(gate).toContain('Open / start production IDE');
  });
});
