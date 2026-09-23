import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');

// Source regressions are not substitutes for live two-customer isolation tests.
describe('Existing Coder workspace resume', () => {
  const route = read('apps/web/app/api/user-workspace/coder/[slotId]/open/route.ts');
  const list = read('apps/web/app/api/user-workspace/coder/route.ts');
  const page = read('apps/web/app/wonderspace/workspaces/page.tsx');
  const customerRoute = read('apps/web/app/api/user-workspace/customer/open/[slotId]/route.ts');

  it('uses the verified Supabase session and scopes the operator slot to that user', () => {
    expect(route).toContain('authenticatedSupabaseUser(request)');
    expect(route).toContain('assertSoleOperator(userId)');
    expect(route).toContain('getCoderSlot(userId, slotId)');
    expect(route).toContain("slot.state !== 'provisioned'");
    expect(route).toContain('slot.coder_api_origin !== coderApiConfig().url');
  });

  it('verifies the Coder token identity and original operator workspace before giving out a link', () => {
    expect(route).toContain("coderApiRequest('/api/v2/users/me', 'GET')");
    expect(route).toContain('workspace.owner_id !== identity.id');
    expect(route).toContain('workspace.owner_name !== identity.username');
    expect(route).toContain('workspace.name !== slot.workspace_name');
    expect(route).toContain('publicCoderOrigin()');
  });

  it('starts only an existing operator ID, never provisions a new workspace or releases a paid slot', () => {
    expect(route).toContain("coderApiRequest(`${workspacePath}/builds`, 'POST', { transition: 'start' })");
    expect(route).not.toContain('createWorkspace(');
    expect(route).not.toContain("'/api/v2/users/me/workspaces'");
    expect(route).not.toContain('reserveCoderSlot(');
    expect(route).not.toContain('releaseDeletedCoderSlot(');
    expect(route).toContain("process.env.BILLABLE_OPERATIONS_ENABLED !== 'true'");
  });

  it('keeps operator restart separate from customer read-only handoff', () => {
    expect(list).toContain('const operator = isConfiguredCoderOperator(user.id)');
    expect(list).toContain('let canOpen = operator');
    expect(list).toContain("openMode: canOpen ? (operator ? 'operator' : 'customer') : 'disabled'");
    expect(page).toContain("const customer = openMode === 'customer'");
    expect(page).toContain('/api/user-workspace/customer/open/');
    expect(page).toContain("method: customer ? 'GET' : 'POST'");
    expect(page).toContain('canOpen && slot.workspace_id');
    expect(page).toContain('Open existing IDE');
    expect(page).toContain('Authorization: `Bearer ${session.access_token}`');
    expect(page).toContain('window.location.assign(result.url)');
    expect(page).not.toContain("fetch('/api/user-workspace/provision'");
    expect(customerRoute).toContain('authenticatedSupabaseUser(request)');
    expect(customerRoute).not.toContain('export async function POST');
    expect(customerRoute).not.toContain("transition: 'start'");
  });
});
