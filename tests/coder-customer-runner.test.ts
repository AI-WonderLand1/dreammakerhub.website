import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('customer-only Coder provisioning', () => {
  it('resolves a verified OIDC customer ID, never an operator or browser-provided owner', () => {
    const identity = file('apps/web/lib/coder/customer-identity.server.ts');
    expect(identity).toContain("candidate.login_type === 'oidc'");
    expect(identity).toContain('user.email_confirmed_at');
    expect(identity).toContain("coderApiRequest('/api/v2/users', 'POST'");
    expect(identity).toContain("login_type: 'oidc'");
    expect(identity).toContain("service_account: false");
    expect(identity).toContain("organization_ids: [organizationId]");
    expect(identity).toContain("process.env.CODER_ORG_ID");
    expect(identity).toContain("[coder-customer-enrollment] create user failed");
    expect(identity).toContain("created.status === 401 || created.status === 403");
    expect(identity).toContain('coderUser.id === operatorCoderId');
    expect(identity).toContain(".from('coder_customer_identities')");
    expect(identity).not.toContain('CoderOidcBootstrapRequired');
    expect(identity).not.toContain("url.pathname = '/login'");
    expect(identity).not.toContain('Connect Coder account');
    expect(identity).not.toContain('Sign in to Coder with the same verified account before requesting an IDE.');
  });

  it('keeps customer provisioning fail-closed with operator switches and live verification', () => {
    const source = file('apps/web/lib/coder/customer-provisioning.server.ts');
    const identity = file('apps/web/lib/coder/customer-identity.server.ts');
    expect(source).toContain('CODER_CUSTOMER_PROVISIONING_ENABLED');
    expect(source).toContain('CODER_WORKSPACE_CREATION_ENABLED');
    expect(source).toContain('CODER_WILDCARD_ACCESS_URL');
    expect(source).toContain('verifiedCustomerTemplate()');
    expect(source).not.toContain('assertFreshUsageController');
    expect(identity).toContain("coderApiRequest('/api/v2/users/authmethods', 'GET')");
    expect(identity).not.toContain('CODER_SUPABASE_OIDC_VERIFIED');
  });

  it('keeps created IDEs visible on the WonderSpace IDE page', () => {
    const launch = file('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(launch).toContain("fetch('/api/user-workspace/coder'");
    expect(launch).toContain('My IDEs');
    expect(launch).toContain('Your created WonderSpace IDEs stay here so you can reopen them later.');
    expect(launch).toContain("workspace.state === 'provisioned' ? 'Open IDE' : 'Not ready'");
    expect(launch).toContain('openPrivateIde(workspace.id)');
  });

  it('creates under the verified customer UUID and keeps uncertain slots allocated', () => {
    const worker = file('apps/web/app/api/internal/coder/customer-runner/route.ts');
    expect(worker).toContain('encodeURIComponent(job.coder_user_id)');
    expect(worker).toContain('workspace.owner_id !== job.coder_user_id');
    expect(worker).toContain("status: 'needs_reconciliation'");
    expect(worker).not.toContain('CODER_WORKSPACE_OWNER');
    expect(worker).not.toContain('/users/me/workspaces');
  });

  it('does not ship the removed Kubernetes customer template beside the Railway IDE template', () => {
    expect(existsSync(join(process.cwd(), 'infra/coder/customer-template/main.tf'))).toBe(false);
    const template = file('infra/coder/template/main.tf');
    expect(template).toContain('variable "railway_token"');
    expect(template).toContain('resource "terraform_data" "project"');
    expect(template).toContain('resource "terraform_data" "service"');
    expect(template).toContain('resource "terraform_data" "volume"');
    expect(template).not.toContain('provider "kubernetes"');
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
