import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/server', () => ({ NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) } }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireUserId: vi.fn(async () => 'test-user') }));
vi.mock('@/lib/usage/log', () => ({ logUsage: vi.fn(async () => {}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
async function route() {
  vi.resetModules();
  for (const key of ['PIXAZO_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) vi.stubEnv(key, '');
  vi.stubEnv('PIXAZO_API_KEY', 'private-test-credential');
  return (await import('../apps/web/app/api/ai/image/route')).POST;
}
const request = () => new Request('https://example.com/api/ai/image', { method: 'POST', body: JSON.stringify({ prompt: 'Coffee' }) });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('image provider responses', () => {
  it('accepts a string output.media_url and preserves JPEG MIME', async () => {
    const post = await route();
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ output: { media_url: 'https://example.com/generated.jpg' } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([255, 216, 255, 224]), { headers: { 'content-type': 'image/jpeg' } }));
    vi.stubGlobal('fetch', fetcher);
    const response = await post(request());
    expect(response.status).toBe(200);
    expect((await response.json()).imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('returns a safe actionable failure without the provider body or credentials', async () => {
    const post = await route();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'private-test-credential account details' }, { status: 401 })));
    const response = await post(request());
    const body = await response.text();
    expect(response.status).toBe(502);
    expect(body).toContain('credentials were rejected');
    expect(body).not.toContain('private-test-credential');
    expect(body).not.toContain('account details');
  });
  it('rejects non-image bytes instead of producing an unusable PNG URL', async () => {
    const post = await route();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ url: 'https://example.com/not-image' })).mockResolvedValueOnce(new Response('not an image')));
    expect((await post(request())).status).toBe(502);
  });
});
