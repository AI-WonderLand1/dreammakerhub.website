import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Existing operator IDE link', () => {
  it('checks the current user before showing the existing operator IDE', () => {
    const page = read('apps/web/app/wonderspace/page.tsx');
    const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    const role = read('apps/web/app/api/wonderspace/operator/route.ts');
    expect(page).toContain('supabase.auth.getUser()');
    expect(page).toContain('isConfiguredCoderOperator(user?.id)');
    expect(page).toContain('if (isOperator)');
    expect(page).toContain('WonderSpaceOperatorGate');
    expect(gate).toContain("fetch('/api/wonderspace/operator'");
    expect(gate).toContain('const checkOperator = async () =>');
    expect(gate).toContain("const requestCheck = (token?: string) => fetch('/api/wonderspace/operator'");
    expect(gate).toContain('let response = await requestCheck(accessToken)');
    expect(gate).toContain('response = await requestCheck(data.session.access_token)');
    expect(gate).toContain('const operatorRefreshAttempted = useRef(false)');
    expect(gate).toContain('!operatorRefreshAttempted.current');
    expect(gate).toContain('operatorRefreshAttempted.current = true');
    expect(gate).toContain('refreshUserId.current !== user.id');
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel customerPilot={customerPilot} />");
    expect(gate).toContain("role === 'customer'");
    expect(gate).toContain('Open / start production IDE');
    expect(gate).toContain('does not create another workspace');
    expect(gate).toContain('<CustomerWorkspaceLaunch operatorPreview embedded />');
    expect(gate).not.toContain('href="/dashboard"');
    expect(role).toContain("authenticatedSupabaseUser(request)");
    expect(role).toContain("from '@/lib/supabase/authenticated-user.server'");
    expect(role).toContain('isConfiguredCoderOperator(user.id)');
    expect(role).toContain("'Cache-Control': 'private, no-store'");
    expect(role).not.toContain('CODER_API_TOKEN');
  });

  it('authorizes again, verifies the operator workspace, and restarts the same IDE when stopped', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    expect(route).toContain("authenticatedSupabaseUser(request)");
    expect(route).toContain("from '@/lib/supabase/authenticated-user.server'");
    expect(route).toContain('if (mutation && !isSameOriginRequest(request))');
    expect(route).toContain('isConfiguredCoderOperator(user.id)');
    expect(route).toContain('status: 404');
    expect(route).toContain("coderApiRequest('/api/v2/users/me', 'GET')");
    expect(route).toContain('/api/v2/users/me/workspace/');
    expect(route).toContain('/builds');
    expect(route).toContain("{ transition: 'start' }");
    expect(route).toContain("if (state === 'starting') return { url: OPERATOR_IDE_URL }");
    expect(route).toContain('workspace.owner_id !== identity.id');
    expect(route).toContain('https://coder.dreammakerhub.website/@wonderingtribe/production.main/apps/code-server/');
    expect(route).toContain("'Cache-Control': 'private, no-store'");
    expect(route).toContain('export async function POST(request: Request)');
    expect(gate).toContain("fetch('/wonderspace/my-ide'");
    expect(gate).toContain('Authorization: `Bearer ${token}`');
    expect(gate).not.toContain('CODER_API_TOKEN');
    expect(route).not.toContain('CODER_API_TOKEN');
    expect(route).not.toContain('request.nextUrl.searchParams');
    expect(route).not.toContain('POST /workspaces');
  });

  it('uses the latest browser session and makes at most one refresh attempt on a rejected operator token', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    expect(gate).toContain('client.auth.getSession()');
    expect(gate).toContain('if (response.status === 401 && client)');
    expect(gate).toContain('client.auth.refreshSession()');
    expect(gate).toContain('response = await requestOpen(data.session.access_token)');
    expect(gate).toContain("method: 'POST'");
    expect(gate).not.toContain('Open existing IDE in Coder');
    expect(gate).toContain('Manage production in Coder');
    expect(gate).toContain('Sign in to DreamMakerHub');
    expect(route).toContain("authenticatedSupabaseUser(request)");
    expect(route).toContain('if (mutation && !isSameOriginRequest(request))');
    expect(route).toContain("'/public-pages/auth?redirectTo=%2Fwonderspace'");
    expect(route).not.toContain("new URL('/auth/login', request.url)");
  });

  it('recognizes Coder succeeded start/stop builds as running/stopped states', () => {
    const route = read('apps/web/app/wonderspace/my-ide/route.ts');
    expect(route).toContain("buildStatus === 'succeeded' && transition === 'start'");
    expect(route).toContain("buildStatus === 'succeeded' && transition === 'stop'");
  });

  it('uses one dedicated operator check for every shared-Coder entry point', () => {
    const access = read('apps/web/lib/coder/operator-access.server.ts');
    const slots = read('apps/web/lib/coder/workspace-slots.server.ts');
    const customerIdentity = read('apps/web/lib/coder/customer-identity.server.ts');
    const slotOpen = read('apps/web/app/api/user-workspace/coder/[slotId]/open/route.ts');
    const status = read('apps/web/app/api/user-workspace/coder/route.ts');
    expect(access).toContain('process.env.CODER_OPERATOR_SUPABASE_ID?.trim()');
    expect(access).toContain('return adminIds.length === 1 ? adminIds[0] : null;');
    expect(slots).toContain('isConfiguredCoderOperator(userId)');
    expect(customerIdentity).toContain('isConfiguredCoderOperator(user.id)');
    expect(slotOpen).toContain('assertSoleOperator(userId)');
    expect(slotOpen).not.toContain('adminIds.includes');
    expect(status).toContain('const operator = isConfiguredCoderOperator(user.id)');
    expect(status).toContain('let canOpen = operator');
    expect(status).toContain("openMode: canOpen ? (operator ? 'operator' : 'customer') : 'disabled'");
  });

  it('keeps the customer launcher gated for customers while still showing the operator preview form', () => {
    const gate = read('apps/web/components/engines/WonderSpaceOperatorGate.tsx');
    const customer = read('apps/web/components/engines/CustomerWorkspaceLaunch.tsx');
    expect(gate).toContain("role === 'customer' && customerPilot");
    expect(gate).toContain('Cloud IDE access is private');
    expect(gate).toContain('<CustomerWorkspaceLaunch operatorPreview embedded />');
    expect(customer).toContain('operatorPreview');
    expect(customer).not.toContain('href="/dashboard"');
    expect(gate).not.toContain("import WonderSpaceLaunch from './WonderSpaceLaunch'");
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
