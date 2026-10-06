import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('customer Google Docker IDE opening', () => {
  it('reverifies the exact customer identity, slot and template before returning an IDE URL', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    expect(route).toContain('authenticatedSupabaseUser(request)');
    expect(route).toContain('verifiedCustomerCoderOwner');
    expect(route).toContain('verifiedCustomerTemplateId');
    expect(route).toContain('assertFreshUsageController');
    expect(route).toContain("job.data.status !== 'ready'");
    expect(route).toContain('workspace.owner_id !== coderUserId');
    expect(route).toContain('workspace.template_id !== templateId');
    expect(route).toContain('slot.coder_api_origin !== coderApiConfig().url');
    expect(route).toContain('CODER_ACCESS_URL');
    expect(route).toContain('/apps/code-server/');
    expect(route).toContain('export async function POST');
    expect(route).not.toContain('/api/v2/users/me');
    expect(route).not.toContain('CODER_API_TOKEN');
  });

  it('checks cumulative compute budget before restarting a stopped customer workspace', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    expect(route).toContain("from('coder_customer_compute_usage')");
    expect(route).toContain("from('coder_customer_compute_monthly')");
    expect(route).toContain('verifiedCostPlan(userId)');
    expect(route).toContain('PLAN_LIMITS[plan].computeCreditsMonthly');
    expect(route).toContain("transition: 'start'");
    expect(route).toContain('assertRestartBudget(user.id, slotId)');
  });

  it('exposes customer creation separately without changing the operator WonderSpace entry', () => {
    const page = file('apps/web/app/wonderspace/page.tsx');
    const create = file('apps/web/app/wonderspace/create/page.tsx');
    const gate = file('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    const launch = file('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');

    expect(page).toContain('WonderSpaceOperatorGate');
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
    expect(gate).not.toContain('<CustomerWorkspaceLaunch');
    expect(create).toContain('<CustomerWorkspaceLaunch');
    expect(create).toContain('CODER_CUSTOMER_DIRECT_ACCESS_VERIFIED');
    expect(launch).toContain('/api/user-workspace/customer/open/');
    expect(launch).toContain('Open private IDE');
    expect(launch).toContain('window.location.assign(result.url)');
  });

  it('retains hardened Coder deployment defaults for customer identities', () => {
    for (const path of ['deploy/upcloud/docker-compose.yml', 'deploy/k8s/coder-deployment.yaml']) {
      const deployment = file(path);
      expect(deployment).toContain('CODER_DISABLE_WORKSPACE_SHARING');
      expect(deployment).toContain('CODER_DISABLE_OWNER_WORKSPACE_ACCESS');
      expect(deployment).toContain('CODER_DISABLE_PATH_APPS');
      expect(deployment).toContain('CODER_OIDC_ALLOW_SIGNUPS');
    }
  });
});
