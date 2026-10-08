import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('customer Google Docker IDE opening', () => {
  it('reverifies the exact customer identity, slot and template before returning an IDE URL', () => {
    const route = file('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');
    const access = file('apps/web/lib/coder/customer-workspace-access.server.ts');
    expect(route).toContain('authenticatedSupabaseUser(request)');
    expect(route).toContain('verifiedCustomerWorkspace(request, slotId)');
    expect(access).toContain('verifiedCustomerCoderOwner');
    expect(access).toContain('verifiedCustomerTemplateId');
    expect(access).not.toContain('assertFreshUsageController');
    expect(access).toContain("job.data.status !== 'ready'");
    expect(access).toContain('workspace.owner_id !== coderUserId');
    expect(access).toContain('workspace.template_id !== templateId');
    expect(access).toContain('slot.coder_api_origin !== coderApiConfig().url');
    expect(access).toContain('CODER_WILDCARD_ACCESS_URL');
    expect(access).toContain("candidate.slug === 'code-server'");
    expect(access).toContain("app.subdomain === true");
    expect(access).not.toContain('CODER_ACCESS_URL');
    expect(access).toContain('code-server--${workspaceName}--${owner}');
    expect(access).toContain("workspace.owner_name && workspace.name");
    expect(access).toContain("workspace.owner_name = owner.username");
    expect(access).toContain("/api/v2/workspaces/");
    expect(access).not.toContain("include_related=");
    expect(access).not.toContain('/apps/code-server/');
    expect(route).toContain('export async function POST');
    expect(access).not.toContain('/api/v2/users/me');
    expect(access).not.toContain('CODER_API_TOKEN');
  });

  it('opens a verified workspace through a normal link and server redirect', () => {
    const route = file('apps/web/app/api/user-workspace/customer/launch/[slotId]/route.ts');
    const access = file('apps/web/lib/coder/customer-workspace-access.server.ts');

    expect(route).toContain('verifiedCustomerWorkspace(request, slotId)');
    expect(route).toContain('NextResponse.redirect(url, 307)');
    expect(route).toContain("transition: 'start'");
    expect(route).toContain("Refresh': '2'");
    expect(access).toContain('workspace.owner_id !== coderUserId');
    expect(access).toContain('workspace.template_id !== templateId');
    expect(access).toContain('workspace.owner_name = owner.username');
    expect(access).toContain('code-server--${workspaceName}--${owner}');
  });

  it('uses Coder WorkspaceStatus directly so running does not loop as starting', () => {
    const access = file('apps/web/lib/coder/customer-workspace-access.server.ts');
    expect(access).toContain('const build = workspace.latest_build?.status');
    expect(access).toContain('if (build) return build');
    expect(access).not.toContain("if (build === 'running' || build === 'pending')");
    expect(access).not.toContain("if (build === 'succeeded' && transition === 'start')");
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
    expect(launch).toContain('/api/user-workspace/customer/launch/');
    expect(launch).toContain('Open private IDE');
    expect(launch).not.toContain('openPrivateIde');
    expect(launch).not.toContain('window.location.assign(data.url)');
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
