import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Existing operator IDE link', () => {
  it('only displays the existing IDE link for a verified Supabase administrator', () => {
    const page = read('apps/web/app/wonderspace/page.tsx');
    const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    const role = read('apps/web/app/api/wonderspace/operator/route.ts');
    expect(page).toContain('supabase.auth.getUser()');
    expect(page).toContain("process.env.ADMIN_USER_IDS");
    expect(page).toContain('adminIds.includes(user.id)');
    expect(page).toContain('if (isOperator)');
    expect(page).toContain('WonderSpaceOperatorGate');
    expect(gate).toContain("fetch('/api/wonderspace/operator'");
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
    expect(gate).toContain("role === 'customer'");
    expect(gate).toContain('Open / start production IDE');
    expect(gate).toContain('does not create another workspace');
    expect(role).toContain('authenticatedSupabaseUser(request)');
    expect(role).toContain('adminIds.includes(user.id)');
    expect(role).toContain("'Cache-Control': 'private, no-store'");
    expect(role).not.toContain('CODER_API_TOKEN');
  });

  it('authorizes again, verifies the operator workspace, and restarts the same IDE when stopped', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain('supabase.auth.getUser(bearer)');
    expect(route).toContain('if (bearerOnly && !bearer)');
    expect(route).toContain('adminIds.includes(user.id)');
    expect(route).toContain('status: 404');
    expect(route).toContain("coderApiRequest('/api/v2/users/me', 'GET')");
    expect(route).toContain('/api/v2/users/me/workspace/');
    expect(route).toContain('/builds');
    expect(route).toContain("{ transition: 'start' }");
    expect(route).toContain('workspace.owner_id !== identity.id');
    expect(route).toContain('https://coder.dreammakerhub.website/@wonderingtribe/production.main/apps/code-server/');
    expect(route).toContain("'Cache-Control': 'private, no-store'");
    expect(route).toContain('export async function POST(request: Request)');
    expect(gate).toContain("fetch('/wonderspace/my-ide'");
    expect(gate).toContain('Authorization: `Bearer ${session.access_token}`');
    expect(gate).not.toContain('CODER_API_TOKEN');
    expect(route).not.toContain('CODER_API_TOKEN');
    expect(route).not.toContain('request.nextUrl.searchParams');
    expect(route).not.toContain('POST /workspaces');
  });

  it('recognizes Coder succeeded start/stop builds as running/stopped states', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    expect(route).toContain("buildStatus === 'succeeded' && transition === 'start'");
    expect(route).toContain("buildStatus === 'succeeded' && transition === 'stop'");
  });
});

describe('Coder runtime cost-control deployment', () => {
  it('copies the Coder enablement switches into the production runtime environments', () => {
    for (const path of ['.github/workflows/deploy-upcloud.yml', '.github/workflows/deploy-aws-fallback.yml']) {
      const workflow = read(path);
      expect(workflow).toContain('BILLABLE_OPERATIONS_ENABLED:');
      expect(workflow).toContain('CODER_WORKSPACE_CREATION_ENABLED:');
      expect(workflow).toContain('CODER_CUSTOMER_PROVISIONING_ENABLED:');
      expect(workflow).toContain('CODER_OPERATOR_SUPABASE_ID:');
      expect(workflow).toContain('write_env BILLABLE_OPERATIONS_ENABLED');
      expect(workflow).toContain('write_env CODER_WORKSPACE_CREATION_ENABLED');
      expect(workflow).toContain('write_env CODER_CUSTOMER_PROVISIONING_ENABLED');
      expect(workflow).toContain('write_env CODER_OPERATOR_SUPABASE_ID');
    }
  });
});
