import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');

describe('Coder customer isolation and operator settings', () => {
  it('gets identity from Supabase Auth and never accepts an ID from the request body', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    expect(route).toContain('authenticatedSupabaseUser(request)');
    expect(route).toContain('reserveCoderSlot(user.id, podName)');
    expect(route).toContain('coder.createWorkspace(user.id,');
    expect(route).not.toContain('reserveCoderSlot(body.userId');
    expect(route).not.toContain('reserveCoderSlot(body.user_id');
  });

  it('rejects non-operator requests before parsing launch options or contacting a shared Coder owner', () => {
    const route = read('apps/web/app/api/user-workspace/provision/route.ts');
    const auth = route.indexOf('authenticatedSupabaseUser(request)');
    const earlyGate = route.indexOf('assertCoderOwnerIsolation(user.id);');
    const parseBody = route.indexOf('await request.json()');
    const apiConfig = route.indexOf('coderApiConfig()');
    const healthCheck = route.indexOf('coder.healthCheck()');
    const templateLookup = route.indexOf('getCoderLaunchConfig()', auth);
    const reservation = route.indexOf('await reserveCoderSlot(');
    expect(earlyGate).toBeGreaterThan(auth);
    expect(earlyGate).toBeLessThan(parseBody);
    expect(earlyGate).toBeLessThan(apiConfig);
    expect(earlyGate).toBeLessThan(healthCheck);
    expect(earlyGate).toBeLessThan(templateLookup);
    expect(earlyGate).toBeLessThan(reservation);
    expect(route).toContain('return costGateResponse(error instanceof CostGateError ? error : undefined);');
  });

  it('blocks customer provisioning independently of operator cost switches', () => {
    const guard = read('apps/web/lib/coder/workspace-slots.server.ts');
    const methodStart = guard.indexOf('export async function reserveCoderSlot(');
    const isolation = guard.indexOf('assertCoderOwnerIsolation(userId);', methodStart);
    const switches = guard.indexOf("process.env.BILLABLE_OPERATIONS_ENABLED !== 'true'", methodStart);
    const reserve = guard.indexOf(".rpc('reserve_coder_workspace_slot'", methodStart);
    expect(isolation).toBeGreaterThan(methodStart);
    expect(isolation).toBeLessThan(switches);
    expect(switches).toBeLessThan(reserve);
    expect(guard).toContain("(process.env.ADMIN_USER_IDS || '').split(',')");
    expect(guard).toContain('if (!operatorIds.includes(userId))');
    expect(guard).not.toContain('process.env.CODER_ALLOW_ALL_USERS');
  });

  it('only renders private IDE operations for a verified server-side admin', () => {
    const page = read('apps/web/app/settings/admin/ide/page.tsx');
    const account = read('apps/web/app/settings/account/page.tsx');
    expect(page).toContain('supabase.auth.getUser()');
    expect(page).toContain('if (!adminIds.includes(user.id)) notFound()');
    expect(page).not.toContain('sessionStorage');
    expect(page).not.toContain('CODER_API_TOKEN}');
    expect(account).toContain('const isAdmin = !error &&');
    expect(account).toContain('href="/settings/admin/ide"');
  });

  it('does not confuse Coder inactivity autostop with a hard usage allowance', () => {
    const guard = read('apps/web/lib/coder/workspace-slots.server.ts');
    const page = read('apps/web/app/settings/admin/ide/page.tsx');
    expect(guard).toContain('Coder TTL is an inactivity-based autostop request, NOT cumulative IDE time');
    expect(page).toContain('No cumulative usage meter or hard time cutoff has been verified');
  });
});
