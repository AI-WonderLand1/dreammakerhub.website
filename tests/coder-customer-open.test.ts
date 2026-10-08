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
    expect(route).not.toContain('assertFreshUsageController');
    expect(route).toContain("job.data.status !== 'ready'");
    expect(route).toContain('workspace.owner_id !== coderUserId');
    expect(route).toContain('workspace.template_id !== templateId');
    expect(route).toContain('slot.coder_api_origin !== coderApiConfig().url');
    expect(route).toContain('CODER_WILDCARD_ACCESS_URL');
    expect(route).toContain("candidate.slug === 'code-server'");
    expect(route).toContain("app.subdomain === true");
    expect(route).toContain('CODER_WILDCARD_ACCESS_URL');
    expect(route).not.toContain('CODER_ACCESS_URL');
    expect(route).toContain('code-server--${workspaceName}--${owner}');
    expect(route).toContain("workspace.owner_name && workspace.name");
    expect(route).toContain("workspace.owner_name = owner.username");
    expect(route).toContain("/api/v2/workspaces/");
    expect(route).not.toContain("include_related=");
    expect(route).not.toContain('/apps/code-server/');
    expect(route).toContain('export async function POST');
    expect(route).not.toContain('/api/v2/users/me');
    expect(route).not.toContain('CODER_API_TOKEN');
  });

  it('restarts a stopped customer workspace without a cumulative time budget', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    expect(route).not.toContain("from('coder_customer_compute_usage')");
    expect(route).not.toContain("from('coder_customer_compute_monthly')");
    expect(route).not.toContain('assertRestartBudget');
    expect(route).toContain("transition: 'start'");
  });

  it('uses the project IDE as the one customer creation and reopen surface', () => {
    const page = file('apps/web/app/wonderspace/page.tsx');
    const create = file('apps/web/app/wonderspace/create/page.tsx');
    const gate = file('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    const launch = file('apps/web/components/engines/WonderSpaceLaunch.tsx');

    expect(page).toContain('WonderSpaceOperatorGate');
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
    expect(gate).not.toContain('<CustomerWorkspaceLaunch');
    expect(create).toContain('wonderSpaceProjectIde');
    expect(create).toContain('WONDERSPACE_CODE_HOME');
    expect(create).not.toContain('<CustomerWorkspaceLaunch');
    expect(launch).toContain('/api/user-workspace/customer/open/');
    expect(launch).toContain('Open private IDE');
    expect(launch).toContain('window.location.assign(data.url)');
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
