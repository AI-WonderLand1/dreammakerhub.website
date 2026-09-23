import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) },
}));
vi.mock('@/app/utils/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

const { createSupabaseServerClient } = await import('@/app/utils/supabase/server');
const { GET, POST } = await import('../apps/web/app/api/auth/session/route');

const getUser = vi.fn();
const getSession = vi.fn();
const request = () => new Request('https://dreammakerhub.website/api/auth/session') as any;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { getUser, getSession },
  } as any);
  vi.stubEnv('ADMIN_USER_IDS', 'operator-uuid');
});

afterEach(() => vi.unstubAllEnvs());

describe('verified site session status used by the confessions UI', () => {
  it('does not report a signed-in user from an unverified or expired session', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Expired' } });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ success: true, session: null, user: null });
    expect(getSession).not.toHaveBeenCalled();
  });

  it('only reports a session when its owner matches the verified Supabase user', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'alice' } }, error: null });
    getSession.mockResolvedValue({ data: {
      session: { access_token: 'private-token', user: { id: 'bob' } },
    }, error: null });
    const response = await GET(request());
    expect(await response.json()).toEqual({ success: true, session: null, user: null });
    expect(await GET(request()).then((res) => res.text())).not.toContain('private-token');
  });

  it('returns the verified identity and existing session format when they match', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'operator-uuid', email: 'owner@example.com' } }, error: null });
    getSession.mockResolvedValue({ data: {
      session: { access_token: 'private-token', user: { id: 'operator-uuid' } },
    }, error: null });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      user: { id: 'operator-uuid', isAdmin: true },
      session: { access_token: 'private-token', user: { id: 'operator-uuid', isAdmin: true } },
    });
  });

  it('does not return a stale identity when Supabase verification is unavailable', async () => {
    getUser.mockRejectedValue(new Error('Upstream auth service unavailable'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('Upstream auth service unavailable');
  });

  it('does not accept POST to fetch the session', async () => {
    const response = await POST(request());
    expect(response.status).toBe(405);
  });
});
