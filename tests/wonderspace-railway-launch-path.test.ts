import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('retired Railway customer entry and preserved backend gates', () => {
  const page = source('apps/web/app/wonderspace/page.tsx');
  const gate = source('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
  const proxy = source('apps/web/lib/wonderspace/customer-sandbox-controller.server.ts');
  const controller = source('infra/wonderspace/customer-controller/server.mjs');
  const release = source('infra/wonderspace/customer-controller/release-gates.mjs');
  const onDemand = source('apps/web/app/wonderspace/on-demand/page.tsx');

  it('offers one canonical WonderSpace launch and preserves the operator IDE', () => {
    expect(page).toContain('WonderSpaceOperatorGate');
    expect(page).not.toContain('railwayCustomerPilot');
    expect(gate).not.toContain('CustomerSandboxIdeEntry');
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
    expect(gate).toContain('DreamMakerHub project files');
    expect(gate).toContain('href="/dashboard?workspaceTab=code#projects"');
    expect(onDemand).toContain('wonderSpaceProjectIde');
    expect(onDemand).toContain('WONDERSPACE_CODE_HOME');
    expect(onDemand).not.toContain('Create & open IDE');
  });

  it('keeps dormant Railway backend fail closed for safe rollback, not customer launch', () => {
    expect(proxy).toContain("WONDERSPACE_CUSTOMER_RUNTIME_ENABLED !== 'true'");
    expect(proxy).toContain('getUser(match[1])');
    expect(controller).toContain('assertSafeControllerEnvironment(process.env)');
    expect(controller).toContain('networkIsolation: "PRIVATE"');
    expect(controller).toContain('MAX_ACTIVE = 1');
    expect(controller).toContain('saveArchive(');
    expect(release).toContain('WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID');
    expect(release).toContain('WONDERSPACE_PRIVATE_NETWORK_REVIEWED');
    expect(release).toContain('env.RAILWAY_API_TOKEN');
  });
});
