import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock('@/lib/auth', () => ({ requireUserId: vi.fn() }));
vi.mock('@/app/utils/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../engine/core/ai/runModel', () => ({ runModel: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/billing/cost-guard.server', () => ({
  CostGateError: class CostGateError extends Error {},
  costGateResponse: vi.fn(),
  reserveAgentRequest: vi.fn(),
}));

async function setup(userId: string | null, plan: string) {
  vi.resetModules();
  const { requireUserId } = await import('@/lib/auth');
  const { createClient } = await import('@/app/utils/supabase/server');
  const { runModel } = await import('../engine/core/ai/runModel');
  const { reserveAgentRequest } = await import('@/lib/billing/cost-guard.server');
  vi.mocked(requireUserId).mockResolvedValue(userId);
  vi.mocked(createClient).mockResolvedValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { subscription_tier: plan }, error: null }) }) }) }) } as any);
  vi.mocked(reserveAgentRequest).mockResolvedValue('pro');
  const { POST } = await import('../apps/web/app/api/agent/route');
  const req = () => new Request('https://dreammakerhub.website/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'builder', command: 'Write code' }) });
  return { POST, req, runModel: vi.mocked(runModel), reserveAgentRequest: vi.mocked(reserveAgentRequest) };
}

afterEach(() => { vi.resetModules(); vi.clearAllMocks(); });

describe('direct agent authorization', () => {
  it('rejects anonymous callers without contacting an AI provider', async () => {
    const { POST, req, runModel, reserveAgentRequest } = await setup(null, 'pro');
    expect((await POST(req())).status).toBe(401);
    expect(reserveAgentRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });
  it('rejects free users without contacting an AI provider', async () => {
    const { POST, req, runModel, reserveAgentRequest } = await setup('user-1', 'free');
    expect((await POST(req())).status).toBe(402);
    expect(reserveAgentRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });
  it('reserves usage then returns proposed code without claiming to write shared server files', async () => {
    const { POST, req, runModel, reserveAgentRequest } = await setup('user-1', 'pro');
    runModel.mockResolvedValue({ text: '{"code":"export default function App(){return null}","glimpse":"Code proposed","confession":"Not executed"}' });
    const response = await POST(req());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.path).toBeUndefined();
    expect(data.confession).toContain('No project files were saved');
    expect(reserveAgentRequest).toHaveBeenCalledWith('user-1', 'Write code'.length);
    expect(runModel).toHaveBeenCalledTimes(1);
  });
});
