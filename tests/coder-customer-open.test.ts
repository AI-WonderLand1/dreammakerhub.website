import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('customer IDE opening', () => {
  it('requires Supabase authentication, verified customer mapping and a fresh controller', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    expect(route).toContain('authenticatedSupabaseUser(request)');
    expect(route).toContain('customerProvisioningGate()');
    expect(route).not.toContain("verifiedCostPlan(user.id) === 'free'");
    expect(route).toContain('verifiedCustomerTemplateId()');
    expect(route).toContain('assertFreshUsageController()');
    expect(route).toContain('getCoderSlot(user.id, slotId)');
    expect(route).toContain(".from('coder_customer_identities')");
    expect(route).toContain(".from('coder_customer_jobs')");
    expect(route).toContain("job.status !== 'ready'");
  });

  it('checks Coder owner, pinned template version, workspace and HTTPS origin without starting a pod', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    expect(route).toContain("owner.login_type !== 'oidc'");
    expect(route).toContain('workspace.owner_id !== owner.id');
    expect(route).toContain('workspace.template_id !== templateId');
    expect(route).toContain('process.env.CODER_CUSTOMER_TEMPLATE_VERSION_ID');
    expect(route).toContain('workspace.latest_build?.template_version_id !== pinnedVersionId');
    expect(route).toContain("url.protocol !== 'https:'");
    expect(route).toContain('identity.coder_user_id === process.env.CODER_OPERATOR_USER_ID');
    expect(route).not.toContain('export async function POST');
    expect(route).not.toContain('/users/me/workspaces');
    expect(route).not.toContain("/builds', 'POST'");
    expect(route).not.toContain('CODER_API_TOKEN');
  });

  it('uses the customer endpoint from both customer views and reserves the old start path for the operator', () => {
    const launch = file('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
    const manager = file('apps/web/app/wonderspace/workspaces/page.tsx');
    const list = file('apps/web/app/api/user-workspace/coder/route.ts');
    expect(launch).toContain('/api/user-workspace/customer/open/');
    expect(launch).toContain('Open my private IDE');
    expect(manager).toContain('/api/user-workspace/customer/open/');
    expect(manager).toContain("method: customer ? 'GET' : 'POST'");
    expect(list).toContain("operator ? 'operator' : 'customer'");
  });
});
