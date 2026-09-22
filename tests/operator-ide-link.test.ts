import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Existing operator IDE link', () => {
  it('only displays the existing IDE link for a verified Supabase administrator', () => {
    const page = read('apps/web/app/wonderspace/page.tsx');
    expect(page).toContain('supabase.auth.getUser()');
    expect(page).toContain("process.env.ADMIN_USER_IDS");
    expect(page).toContain('adminIds.includes(user.id)');
    expect(page).toContain('if (isOperator)');
    expect(page).toContain('href="/wonderspace/my-ide"');
    expect(page).toContain('Open / start production IDE');
    expect(page).toContain('does not create another workspace');
  });

  it('authorizes again, verifies the operator workspace, and restarts the same IDE when stopped', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain('adminIds.includes(user.id)');
    expect(route).toContain("status: 404");
    expect(route).toContain("coderApiRequest('/api/v2/users/me', 'GET')");
    expect(route).toContain('/api/v2/users/me/workspace/');
    expect(route).toContain("/builds");
    expect(route).toContain("{ transition: 'start' }");
    expect(route).toContain("workspace.owner_id !== identity.id");
    expect(route).toContain('https://coder.dreammakerhub.website/@wonderingtribe/production.main/apps/code-server/');
    expect(route).toContain("'Cache-Control': 'private, no-store'");
    expect(route).not.toContain('CODER_API_TOKEN');
    expect(route).not.toContain('request.nextUrl.searchParams');
    expect(route).not.toContain("POST /workspaces");
  });

  it('recognizes Coder succeeded start/stop builds as running/stopped states', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    expect(route).toContain("buildStatus === 'succeeded' && transition === 'start'");
    expect(route).toContain("buildStatus === 'succeeded' && transition === 'stop'");
  });
});


describe('Coder runtime cost-control deployment', () => {
  it('copies the Coder enablement switches into the production runtime environment', () => {
    const workflow = read('.github/workflows/deploy-upcloud.yml');
    expect(workflow).toContain('BILLABLE_OPERATIONS_ENABLED:');
    expect(workflow).toContain('CODER_WORKSPACE_CREATION_ENABLED:');
    expect(workflow).toContain('CODER_CUSTOMER_PROVISIONING_ENABLED:');
    expect(workflow).toContain('CODER_OPERATOR_SUPABASE_ID:');
    expect(workflow).toContain('write_env BILLABLE_OPERATIONS_ENABLED');
    expect(workflow).toContain('write_env CODER_WORKSPACE_CREATION_ENABLED');
    expect(workflow).toContain('write_env CODER_CUSTOMER_PROVISIONING_ENABLED');
    expect(workflow).toContain('write_env CODER_OPERATOR_SUPABASE_ID');
  });
});
