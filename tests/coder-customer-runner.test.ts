import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('customer-only Coder provisioning', () => {
  it('resolves a verified OIDC customer ID, never an operator or browser-provided owner', () => {
    const identity = file('apps/web/lib/coder/customer-identity.server.ts');
    expect(identity).toContain("candidate.login_type === 'oidc'");
    expect(identity).toContain('user.email_confirmed_at');
    expect(identity).toContain('coderUser.id === operatorCoderId');
    expect(identity).toContain(".from('coder_customer_identities')");
  });

  it('does not reserve until the customer identity, active template, and usage watcher are validated', () => {
    const source = file('apps/web/lib/coder/customer-provisioning.server.ts');
    const owner = source.indexOf('await verifiedCustomerCoderOwner(user)');
    const template = source.indexOf('await verifiedCustomerTemplateId()');
    const controller = source.indexOf('await assertFreshUsageController()');
    const reserve = source.indexOf(".rpc('reserve_coder_workspace_slot'");
    expect(owner).toBeGreaterThan(0);
    expect(template).toBeGreaterThan(owner);
    expect(controller).toBeGreaterThan(template);
    expect(reserve).toBeGreaterThan(controller);
    expect(source).toContain('CODER_CUSTOMER_PROVISIONING_ENABLED');
    expect(source).toContain('CODER_CUSTOMER_HARD_STOP_VERIFIED');
    expect(source).not.toContain('CODER_CUSTOMER_IDE_GATEWAY_VERIFIED');
  });

  it('creates under the verified customer UUID and keeps uncertain slots allocated', () => {
    const worker = file('apps/web/app/api/internal/coder/customer-runner/route.ts');
    expect(worker).toContain('encodeURIComponent(job.coder_user_id)');
    expect(worker).toContain('workspace.owner_id !== job.coder_user_id');
    expect(worker).toContain("status: 'needs_reconciliation'");
    expect(worker).not.toContain('CODER_WORKSPACE_OWNER');
    expect(worker).not.toContain('/users/me/workspaces');
  });

  it('keeps a locked customer namespace and a separate per-workspace disk and pod', () => {
    const template = file('infra/coder/customer-template/main.tf');
    expect(template).toContain('default     = "coder-customers"');
    expect(template).toContain('automount_service_account_token = false');
    expect(template).toContain('read_only_root_filesystem  = true');
    expect(template).toContain('share        = "owner"');
    expect(template).toContain('data.coder_workspace.me.id');
    expect(template).toContain('customer-${data.coder_workspace.me.id}-home');
    expect(template).not.toContain('curl -fsSL https://code-server.dev/install.sh');
    const policy = file('infra/coder/customer-isolation.yaml');
    expect(policy).toContain('name: customer-default-deny');
    expect(policy).toContain('podSelector: {}');
  });

  it('uses a restricted queue and atomic cumulative ledger instead of inactivity TTL for billing', () => {
    const schema = file('supabase/migrations/202609220945_coder_customer_jobs.sql');
    const meter = file('supabase/migrations/202609221000_coder_compute_meter.sql');
    expect(schema).toContain('FOR UPDATE SKIP LOCKED');
    expect(schema).toContain('coder_customer_compute_usage');
    expect(meter).toContain('FOR UPDATE');
    expect(meter).toContain('GRANT EXECUTE ON FUNCTION public.meter_coder_customer_compute(uuid, boolean) TO service_role');
  });
});
