import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('AWS WonderSpace customer pod smoke template', () => {
  it('creates only customer namespace resources with a micro-sized pod and PVC', () => {
    const source = read('infra/coder/customer-smoke-template/main.tf');
    expect(source).toContain('namespace = "coder-customers"');
    expect(source).toContain('storage = "10Gi"');
    expect(source).toContain('cpu    = "1"');
    expect(source).toContain('memory = "2Gi"');
    expect(source).toContain('automount_service_account_token = false');
    expect(source).toContain('allow_privilege_escalation = false');
    expect(source).not.toContain('namespace = "coder"');
    expect(source).not.toContain('privileged = true');
  });

  it('is clearly separated from the production customer template', () => {
    const smoke = read('infra/coder/customer-smoke-template/README.md');
    expect(smoke).toContain('not production-ready');
    expect(smoke).toContain('infra/coder/customer-template/main.tf');
    expect(smoke).toContain('wonderspace-customer-smoke');
  });
});
