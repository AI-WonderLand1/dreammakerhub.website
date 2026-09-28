import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  ensureSupabaseConfig: vi.fn(),
  getSession: vi.fn(),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: mocks.createClient,
  ensureSupabaseConfig: mocks.ensureSupabaseConfig,
}));
import { fetchAuthenticatedProject } from '../apps/web/lib/wonderspace/browser-project-fetch';

describe('Supabase-backed WonderSpace browser file API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureSupabaseConfig.mockResolvedValue(null);
    mocks.createClient.mockReturnValue({ auth: { getSession: mocks.getSession } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok', { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('forwards a refreshed browser session token to the existing same-origin project API', async () => {
    mocks.getSession.mockResolvedValueOnce({ data: { session: { access_token: 'previous-token' } } })
      .mockResolvedValueOnce({ data: { session: { access_token: 'refreshed-token' } } });
    await fetchAuthenticatedProject('/api/projects/p1/files', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    });
    await fetchAuthenticatedProject('/api/projects/p1/files', { method: 'POST' });
    const first = vi.mocked(globalThis.fetch).mock.calls[0][1] as RequestInit;
    const second = vi.mocked(globalThis.fetch).mock.calls[1][1] as RequestInit;
    expect(new Headers(first.headers).get('Authorization')).toBe('Bearer previous-token');
    expect(new Headers(first.headers).get('Content-Type')).toBe('application/json');
    expect(new Headers(second.headers).get('Authorization')).toBe('Bearer refreshed-token');
    expect(second.credentials).toBe('same-origin');
    expect(second.cache).toBe('no-store');
    expect(second.redirect).toBe('error');
  });

  it('preserves cookie authentication when the browser has no Bearer session', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    await fetchAuthenticatedProject('/api/projects/p1/files');
    const init = vi.mocked(globalThis.fetch).mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
    expect(init.credentials).toBe('same-origin');
  });

  it('rejects external and non-project URLs before making any request', async () => {
    await expect(fetchAuthenticatedProject('https://evil.example/api/projects/123')).rejects.toThrow('same-origin');
    await expect(fetchAuthenticatedProject('//evil.example/api/projects/123')).rejects.toThrow('same-origin');
    await expect(fetchAuthenticatedProject('/api/wonderspace/operator')).rejects.toThrow('same-origin');
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('uses the authenticated existing project API for all file mutations and ZIP export', () => {
    const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
    const page = read('apps/web/app/(workspace)/dashboard/projects/[id]/files/page.tsx');
    const explorer = read('apps/web/app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser.tsx');
    const storage = read('apps/web/lib/projects/storage.ts');
    expect(page).toContain('fetchAuthenticatedProject');
    expect(explorer.match(/await fetchAuthenticatedProject/g)?.length).toBe(7);
    expect(explorer).not.toContain('window.location.href = `/api/projects/');
    expect(storage).toContain('.from("_project_files")');
    expect(storage).toContain('await assertOwner(projectId, ownerId)');
  });
});
