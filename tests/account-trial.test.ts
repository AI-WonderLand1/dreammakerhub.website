import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  subscriptions: [] as Array<{plan: string; status: string; stripe_subscription_id: string}>,
  trial: null as null | {started_at: string; expires_at: string},
  trialError: null as null | {message: string},
  start: vi.fn(),
  authenticated: true,
}));
const query = (table: string) => {
  const result = table === 'subscriptions'
    ? { data: state.subscriptions, error: null }
    : { data: state.trial, error: state.trialError };
  const chain: any = { ...result };
  for (const method of ['select', 'eq', 'in']) chain[method] = () => chain;
  chain.limit = () => Promise.resolve(result);
  chain.maybeSingle = () => Promise.resolve(result);
  return chain;
};
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase-service', () => ({ getClient: () => ({from: query}) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  from: query,
  rpc: (...args: unknown[]) => state.start(...args),
  auth: { getUser: async () => ({ data: { user: state.authenticated ? {id: 'account-1'} : null }, error: null }) },
}) }));
import { verifiedCostPlan } from '@/lib/billing/cost-guard.server';
import { POST } from '@/app/api/subscription/ensure/route';
import { PLAN_LIMITS } from '@/lib/billing/limits';

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  state.subscriptions = []; state.trial = null; state.trialError = null; state.authenticated = true;
  state.start.mockReset();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('trial-only account entitlements', () => {
  it('gives inactive legacy accounts no included allowances', () => {
    expect(PLAN_LIMITS.free.aiTokensMonthly).toBe(0);
    expect(PLAN_LIMITS.free.renderCreditsMonthly).toBe(0);
    expect(PLAN_LIMITS.free.workspacesLimit).toBe(0);
    expect(PLAN_LIMITS.free.projectsLimit).toBe(0);
  });
  it('requires an explicit trial start for unpaid accounts', async () => {
    await expect(verifiedCostPlan('account-1')).rejects.toMatchObject({status: 402});
  });
  it('accepts an active trial spanning a month boundary', async () => {
    state.trial = {started_at: '2026-10-30T12:00:00Z', expires_at: '2026-11-13T12:00:00Z'};
    await expect(verifiedCostPlan('account-1')).resolves.toBe('trial');
  });
  it('rejects a trial at the exact expiry instant', async () => {
    state.trial = {started_at: '2026-10-17T12:00:00Z', expires_at: '2026-10-31T12:00:00Z'};
    await expect(verifiedCostPlan('account-1')).rejects.toMatchObject({status: 402});
  });
  it('fails closed when trial verification fails', async () => {
    state.trialError = {message: 'database unavailable'};
    await expect(verifiedCostPlan('account-1')).rejects.toMatchObject({status: 503});
  });
  it('keeps verified paid access independent of trial expiry', async () => {
    state.subscriptions = [{plan: 'creator', status: 'active', stripe_subscription_id: 'sub_verified'}];
    await expect(verifiedCostPlan('account-1')).resolves.toBe('creator');
  });
  it('does not treat a profile-like unverified subscription as paid access', async () => {
    state.subscriptions = [{plan: 'creator', status: 'active', stripe_subscription_id: ''}];
    await expect(verifiedCostPlan('account-1')).rejects.toMatchObject({status: 402});
  });
});
const request = (token = true) => new NextRequest('http://localhost/api/subscription/ensure', {
  method: 'POST', headers: token ? {authorization: 'Bearer verified-session'} : {},
});
describe('explicit trial enrollment', () => {
  it('rejects missing and invalid sessions without starting a trial', async () => {
    expect((await POST(request(false))).status).toBe(401);
    state.authenticated = false;
    expect((await POST(request())).status).toBe(401);
    expect(state.start).not.toHaveBeenCalled();
  });
  it('starts the authenticated account through the idempotent database operation', async () => {
    state.start.mockResolvedValue({data: [{started_at: '2026-10-31T12:00:00Z', expires_at: '2026-11-14T12:00:00Z'}], error: null});
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({plan: 'trial', expiresAt: '2026-11-14T12:00:00Z'});
    expect(state.start).toHaveBeenCalledWith('start_account_trial', {p_user_id: 'account-1'});
  });
  it('does not enroll existing paid subscribers in a trial', async () => {
    state.subscriptions = [{plan: 'pro', status: 'active', stripe_subscription_id: 'sub_paid'}];
    expect(await (await POST(request())).json()).toMatchObject({plan: 'pro'});
    expect(state.start).not.toHaveBeenCalled();
  });
  it('rejects an expired enrollment without granting new access', async () => {
    state.start.mockResolvedValue({data: [{expires_at: '2026-10-31T12:00:00Z'}], error: null});
    expect((await POST(request())).status).toBe(402);
  });
});
