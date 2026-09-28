import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  bearerClient: vi.fn(),
  cookieClient: vi.fn(),
  requireUserId: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.bearerClient }));
vi.mock('@/lib/supabase/server-client', () => ({ createSupabaseServerClient: mocks.cookieClient }));
vi.mock('@/lib/auth', () => ({ requireUserId: mocks.requireUserId }));

import { listProjects } from '../apps/web/lib/projects/storage';
import { requirePaidAIUser } from '../apps/web/app/api/ai/auth';
import { NextRequest } from 'next/server';

const owner = '00000000-0000-4000-8000-000000000001';
const row = {
  id: '00000000-0000-4000-8000-000000000002',
  owner_id: owner,
  name: 'My project',
  tool: 'workspace',
  publish_enabled: false,
  custom_domain: null,
  last_publish_id: null,
  created_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
};

function projectClient() {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [row], error: null }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
});

describe('WonderSpace project storage request authentication', () => {
  it('runs project reads under the current browser Bearer token even without SSR cookies', async () => {
    const client = projectClient();
    mocks.headers.mockResolvedValue(new Headers({ Authorization: 'Bearer valid-browser-token' }));
    mocks.bearerClient.mockReturnValue(client);

    const projects = await listProjects(owner);
    expect(projects).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith('_projects');
    expect(mocks.bearerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'public-test-key',
      expect.objectContaining({
        global: { headers: { Authorization: 'Bearer valid-browser-token' } },
      }),
    );
    expect(mocks.cookieClient).not.toHaveBeenCalled();
  });

  it('continues using existing cookie-scoped storage when no Bearer token is sent', async () => {
    mocks.headers.mockResolvedValue(new Headers());
    mocks.cookieClient.mockResolvedValue(projectClient());

    expect(await listProjects(owner)).toHaveLength(1);
    expect(mocks.cookieClient).toHaveBeenCalledOnce();
    expect(mocks.bearerClient).not.toHaveBeenCalled();
  });

  it('requires the explicit Bearer identity instead of trusting a different cookie user', async () => {
    mocks.requireUserId.mockResolvedValue(owner);
    const request = new NextRequest('http://localhost/api/projects', {
      headers: { Authorization: 'Bearer valid-browser-token' },
    });
    expect(await requirePaidAIUser(request)).toEqual({ userId: owner });
    expect(mocks.cookieClient).not.toHaveBeenCalled();
    expect(mocks.requireUserId).toHaveBeenCalledWith(request);
  });

  it('rejects an invalid explicit Bearer token rather than falling back to cookies', async () => {
    mocks.requireUserId.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/projects', {
      headers: { Authorization: 'Bearer expired-token' },
    });
    const result = await requirePaidAIUser(request);
    expect(result).toHaveProperty('status', 401);
    expect(mocks.cookieClient).not.toHaveBeenCalled();
  });

  it('preserves cookie-only authentication', async () => {
    mocks.cookieClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: owner } }, error: null }) },
    });
    const request = new NextRequest('http://localhost/api/projects');
    expect(await requirePaidAIUser(request)).toEqual({ userId: owner });
  });
});
