import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), reserve: vi.fn(), model: vi.fn() }));
vi.mock('@/app/api/ai/auth', () => ({ requirePaidAIUser: mocks.auth }));
vi.mock('@/lib/billing/cost-guard.server', () => ({ reserveAiRequest: mocks.reserve }));
vi.mock('../apps/web/core/ai/runModel', () => ({ runModel: mocks.model }));
import { POST } from '../apps/web/app/api/build/stream/route';
const request = (extra = {}) => new NextRequest('https://example.test/api/build/stream', { method: 'POST', body: JSON.stringify({ prompt: 'Create a landing page', ...extra }) });
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'true'); vi.stubEnv('OPENROUTER_API_KEY', 'test-key'); mocks.auth.mockResolvedValue({ userId: 'owner-id' }); mocks.reserve.mockResolvedValue({}); mocks.model.mockResolvedValue({ text: '<html>result</html>' }); });
afterEach(() => vi.unstubAllEnvs());
describe('metered streamed builder', () => {
  it('does not call providers or reserve usage for anonymous requests', async () => { mocks.auth.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 })); expect((await POST(request())).status).toBe(401); expect(mocks.reserve).not.toHaveBeenCalled(); expect(mocks.model).not.toHaveBeenCalled(); });
  it('keeps the operator billing switch closed', async () => { vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'false'); expect((await POST(request())).status).toBe(503); expect(mocks.reserve).not.toHaveBeenCalled(); });
  it('reserves before every bounded single-provider stage', async () => { const response = await POST(request()); const text = await response.text(); expect(text).toContain('event: complete'); expect(mocks.reserve).toHaveBeenCalledTimes(3); expect(mocks.model).toHaveBeenCalledTimes(3); for (let i=0;i<3;i++) { expect(mocks.reserve.mock.invocationCallOrder[i]).toBeLessThan(mocks.model.mock.invocationCallOrder[i]); expect(mocks.reserve.mock.calls[i][0]).toBe('owner-id'); expect(mocks.reserve.mock.calls[i][2]).toBe(2048); expect(mocks.model.mock.calls[i][0]).toMatchObject({ maxTokens: 2048, singleProviderAttempt: true }); } });
  it('stops without calling a provider when the reservation fails', async () => { mocks.reserve.mockRejectedValue(new Error('Allowance exhausted')); const text = await (await POST(request())).text(); expect(text).toContain('Allowance exhausted'); expect(text).not.toContain('event: complete'); expect(mocks.model).not.toHaveBeenCalled(); });
  it('does not start more stages after a provider failure', async () => { mocks.model.mockResolvedValue({ text: '', error: 'Provider failed' }); const text = await (await POST(request())).text(); expect(text).toContain('event: error'); expect(mocks.reserve).toHaveBeenCalledTimes(1); });
  it('rejects shared-server saves and unavailable spatial assets', async () => { expect((await POST(request({ save: true }))).status).toBe(400); expect((await POST(request({ type: 'spatial' }))).status).toBe(503); expect(mocks.reserve).not.toHaveBeenCalled(); });
});
