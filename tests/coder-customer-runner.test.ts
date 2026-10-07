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
    expect(identity).toContain("coderApiRequest('/api/v2/organizations', 'GET')");
    expect(identity).toContain('organization.is_default === true');
    expect(identity).toContain("process.env.CODER_ORG_ID?.trim()");
    expect(identity).toContain('organizations.some((organization) => organization.id === configured)');
    expect(identity).toContain("process.env.CODER_CUSTOMER_ORG_NAME?.trim().toLowerCase()");
    expect(identity).toContain("organization.display_name?.trim().toLowerCase() === configuredName");
    expect(identity).toContain('if (matches.length === 1) return matches[0].id');
    expect(identity).toContain('if (defaults.length === 1) return defaults[0].id');
    expect(identity).toContain('if (organizations.length === 1) return organizations[0].id');
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

  it('lets users delete and edit resources for saved IDEs', () => {
    const launch = file('apps/web/components/engines/WonderSpaceLaunch.tsx');
    const manage = file('apps/web/app/api/user-workspace/coder/[slotId]/route.ts');
    expect(launch).toContain('Edit resources');
    expect(launch).toContain('Delete');
    expect(launch).toContain("method: 'DELETE'");
    expect(launch).toContain("method: 'PATCH'");
    expect(manage).toContain('export async function PATCH');
    expect(manage).toContain("rich_parameter_values: rich");
    expect(manage).toContain("machine_profile: profile.id");
    expect(manage).toContain("compute_multiplier: profile.computeMultiplier");
  });

  it('uses a user-safe realtime workspace mirror', () => {
    const launch = file('apps/web/components/engines/WonderSpaceLaunch.tsx');
    const migration = file('supabase/migrations/202610071245_realtime_coder_billing.sql');
    expect(launch).toContain("table: 'coder_workspace_realtime'");
    expect(launch).toContain("filter: \`user_id=eq.\${user.id}\`");
    expect(launch).toContain("workspaceLive ? 'Live' : 'Connected'");
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.coder_workspace_realtime');
    expect(migration).toContain('Users read own Coder realtime state');
    expect(migration).toContain('AFTER INSERT OR UPDATE OR DELETE ON public.coder_workspace_slots');
    expect(migration).toContain('supabase_realtime ADD TABLE public.coder_workspace_realtime');
  });

  it('keeps created IDEs visible on the WonderSpace IDE page', () => {
    const launch = file('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(launch).toContain("fetch('/api/user-workspace/coder'");
    expect(launch).toContain('My IDEs');
    expect(launch).toContain('Your created WonderSpace IDEs stay here so you can reopen them later.');
    expect(launch).toContain("workspace.state === 'provisioned' ? 'Open IDE' : 'Not ready'");
    expect(launch).toContain('openPrivateIde(workspace.id)');
  });


  it('keeps polling deleting workspaces until Coder confirms removal', () => {
    const launch = file('apps/web/components/engines/WonderSpaceLaunch.tsx');
    expect(launch).toContain("workspace.state === 'deleting'");
    expect(launch).toContain('deletionReconcileInFlight');
    expect(launch).toContain("method: 'DELETE'");
    expect(launch).toContain('await refreshSavedWorkspaces()');
    expect(launch).toContain("workspace.state === 'reserved' || workspace.state === 'deleting'");
    expect(launch).toContain("workspace.state === 'deleting' ? 'Deleting…' : 'Delete'");
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
