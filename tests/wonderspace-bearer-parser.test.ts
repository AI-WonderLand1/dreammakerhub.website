import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.createServerClient }));
import { requireUserId } from '../apps/web/lib/auth';

const owner = '00000000-0000-4000-8000-000000000001';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-test-key');
  mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser } });
  mocks.getUser.mockImplementation(async (token: string) => ({
    data: { user: token === 'valid-browser-token' ? { id: owner } : null },
  }));
});
afterEach(() => vi.unstubAllEnvs());

describe('Shared Supabase Bearer parser for verified project access', () => {
  it.each(['Bearer valid-browser-token', 'bearer valid-browser-token', 'Bearer\\tvalid-browser-token'])(
    'accepts valid Authorization scheme %s without consulting SSR cookies', async (authorization) => {
      const header = authorization.replace('\\t', '\t');
      const userId = await requireUserId(new Request('http://localhost/api/projects', {
        headers: { Authorization: header },
      }));
      expect(userId).toBe(owner);
      expect(mocks.getUser).toHaveBeenCalledWith('valid-browser-token');
      expect(mocks.createClient).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'public-test-key',
        expect.objectContaining({
          global: { headers: { Authorization: 'Bearer valid-browser-token' } },
        }),
      );
      expect(mocks.createServerClient).not.toHaveBeenCalled();
    },
  );

  it.each(['Basic abc', 'Bearer', 'Bearer first second', ''])(
    'rejects malformed explicit Authorization %s instead of falling back to cookies', async (authorization) => {
      const result = await requireUserId(new Request('http://localhost/api/projects', {
        headers: { Authorization: authorization },
      }));
      expect(result).toBe(null);
      expect(mocks.createClient).not.toHaveBeenCalled();
      expect(mocks.createServerClient).not.toHaveBeenCalled();
    },
  );
});
