import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ auth: vi.fn(), decrypt: vi.fn(), reserve: vi.fn(), plan: vi.fn(), fetch: vi.fn(), eq: vi.fn(), row: null as any }));
vi.mock('@/lib/supabase/authenticated-user.server', () => ({ authenticatedSupabaseUser: state.auth }));
vi.mock('@/lib/supabase-service', () => ({ getClient: () => {
 const query: any = { select: () => query, eq: (...args: any[]) => { state.eq(...args); return query; }, maybeSingle: async () => ({ data: state.row, error: null }) };
 return { from: () => query };
} }));
vi.mock('@/lib/crypto/secrets', () => ({ decryptSecret: state.decrypt }));
vi.mock('@/lib/billing/cost-guard.server', () => ({ verifiedCostPlan: state.plan, reserveBillableUnits: state.reserve, CostGateError: class extends Error {}, costGateResponse: () => Response.json({ error: 'Usage verification unavailable' }, { status: 503 }) }));
import { POST } from '../apps/web/app/api/ai-providers/chat/route';
const request = (extra = {}) => new Request('https://example.test/api/ai-providers/chat', { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], ...extra }) });
beforeEach(() => { vi.resetAllMocks(); state.auth.mockResolvedValue({ id: 'verified-owner' }); state.row = { provider: 'openrouter', default_model: 'vendor/model', api_key_encrypted: 'cipher', api_key_iv: 'iv', api_key_tag: 'tag', base_url: null }; state.decrypt.mockReturnValue('private-provider-key'); state.plan.mockResolvedValue('free'); state.reserve.mockResolvedValue(undefined); state.fetch.mockResolvedValue(Response.json({ choices: [{ message: { content: 'Hello back' } }] })); vi.stubGlobal('fetch', state.fetch); });
afterEach(() => vi.unstubAllGlobals());
describe('centrally saved account provider', () => {
  it('denies anonymous requests before credential lookup', async () => { state.auth.mockResolvedValue(null); expect((await POST(request())).status).toBe(401); expect(state.eq).not.toHaveBeenCalled(); expect(state.fetch).not.toHaveBeenCalled(); });
  it('rejects oversized output budgets before usage reservation', async () => { expect((await POST(request({ maxTokens: 5000 }))).status).toBe(400); expect(state.reserve).not.toHaveBeenCalled(); });
  it('loads credentials only for the verified owner and reserves BYOK requests before calling', async () => { const response = await POST(request({ source: 'ai-playground' })); expect(response.status).toBe(200); const output = await response.text(); expect(output).toContain('Hello back'); expect(output).not.toContain('private-provider-key'); expect(state.eq).toHaveBeenCalledWith('user_id', 'verified-owner'); expect(state.reserve.mock.invocationCallOrder[0]).toBeLessThan(state.fetch.mock.invocationCallOrder[0]); expect(state.reserve.mock.calls[0][1]).toBe('ai_requests'); expect(state.fetch.mock.calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions'); });
  it('never sends keys to a user-supplied base URL', async () => { state.row.base_url = 'https://attacker.test'; expect((await POST(request())).status).toBe(400); expect(state.decrypt).not.toHaveBeenCalled(); expect(state.fetch).not.toHaveBeenCalled(); });
  it('blocks provider requests if billing is unavailable', async () => { state.reserve.mockRejectedValue(new Error('Database unavailable')); expect((await POST(request())).status).toBe(503); expect(state.fetch).not.toHaveBeenCalled(); });
  it('does not fall back to platform keys when the account key is missing', async () => { state.row.api_key_encrypted = null; expect((await POST(request())).status).toBe(503); expect(state.reserve).not.toHaveBeenCalled(); expect(state.fetch).not.toHaveBeenCalled(); });
  it('uses Gemini API-key authentication and enforces its output limit', async () => { state.row.provider='google'; state.row.default_model='gemini-test'; state.fetch.mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: 'Gemini answer' }] } }] })); expect((await POST(request({ maxTokens: 512 }))).status).toBe(200); const [,options]=state.fetch.mock.calls[0]; expect(options.headers['x-goog-api-key']).toBe('private-provider-key'); expect(JSON.parse(options.body).generationConfig.maxOutputTokens).toBe(512); });
});
