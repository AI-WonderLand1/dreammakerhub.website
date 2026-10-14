import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), createClient: vi.fn() }));
vi.mock('@/app/utils/supabase/server', () => ({ createClient: mocks.createClient }));
const request = () => new Request('https://dreammakerhub.website/api/wonder-build/template-library/generate-batch', { headers: { 'x-smoke-user-id': 'smoke-stable-user' } });
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('NEXT_PUBLIC_SMOKE_MODE', 'false'); vi.stubEnv('WONDER_BUILD_REQUIRE_PAID', 'false');
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser } }); mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe('WonderBuild template auth principal', () => {
  it('returns the real account from one verified Supabase lookup', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'real-user', app_metadata: { plan: 'pro' } } }, error: null });
    const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared');
    expect(await requireTemplateUser(request() as any)).toEqual({ userId: 'real-user', response: null }); expect(mocks.getUser).toHaveBeenCalledOnce();
  });
  it('retains a stable smoke user when explicitly enabled outside production', async () => {
    vi.stubEnv('NEXT_PUBLIC_SMOKE_MODE', 'true'); const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared');
    expect(await requireTemplateUser(request() as any)).toEqual({ userId: 'smoke-stable-user', response: null });
  });
  it.each(['test', 'production'])('rejects smoke headers when not authorized in %s', async mode => {
    vi.stubEnv('NODE_ENV', mode); vi.stubEnv('NEXT_PUBLIC_SMOKE_MODE', mode === 'production' ? 'true' : 'false');
    const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared'); const result = await requireTemplateUser(request() as any);
    expect(result.userId).toBeNull(); expect(result.response?.status).toBe(401);
  });
  it('prefers a verified real account over a smoke header', async () => {
    vi.stubEnv('NEXT_PUBLIC_SMOKE_MODE', 'true'); mocks.getUser.mockResolvedValue({ data: { user: { id: 'real-user', app_metadata: {} } }, error: null });
    const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared'); expect((await requireTemplateUser(request() as any)).userId).toBe('real-user');
  });
  it('keeps the existing paid-plan gate and response-only helper', async () => {
    vi.stubEnv('WONDER_BUILD_REQUIRE_PAID', 'true'); mocks.getUser.mockResolvedValue({ data: { user: { id: 'free-user', app_metadata: { plan: 'free' } } }, error: null });
    const { requireUser } = await import('../apps/web/app/api/wonder-build/template-library/shared'); expect((await requireUser(request() as any))?.status).toBe(402);
  });
  it('does not trust a user returned together with an authentication error', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'bad-user' } }, error: new Error('Invalid session') });
    const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared'); expect((await requireTemplateUser(request() as any)).response?.status).toBe(401);
  });
  it('handles unavailable authentication without exposing upstream errors', async () => {
    mocks.createClient.mockRejectedValue(new Error('private upstream error'));
    const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared'); const result = await requireTemplateUser(request() as any);
    expect(result.response?.status).toBe(503); expect(await result.response?.text()).not.toContain('private upstream error');
  });
});
