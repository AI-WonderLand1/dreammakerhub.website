import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock('../apps/web/app/api/wonder-build/template-library/shared', () => ({
  requireUser: vi.fn(async () => null),
  extractJsonArray: (raw: string) => JSON.parse(raw),
}));
vi.mock('@/lib/auth', () => ({ requireUserId: vi.fn(async () => 'test-user') }));
vi.mock('../apps/web/core/ai/runModel', () => ({ runModel: vi.fn() }));
vi.mock('@/lib/builder/free-generation.server', () => ({ runFreeBuilder: vi.fn() }));
vi.mock('@/lib/billing/cost-guard.server', () => {
  class CostGateError extends Error { constructor(message: string, public status = 503) { super(message); } }
  return {
    CostGateError,
    costGateResponse: (e: { message: string; status?: number }) =>
      Response.json({ code: 'COST_GUARD', error: e.message }, { status: e.status || 503 }),
    reserveAiRequest: vi.fn(),
  };
});
vi.mock('@/lib/usage/log', () => ({ logUsage: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

const providerKeys = [
  'OPENROUTER_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY', 'CEREBRAS_API_KEY',
];

async function setup() {
  vi.resetModules();
  vi.clearAllMocks();
  for (const key of providerKeys) vi.stubEnv(key, '');
  vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', '');
  vi.stubEnv('FREE_BUILDER_AI_ENABLED', '');
  const { POST } = await import('../apps/web/app/api/wonder-build/template-library/generate-batch/route');
  const { runModel } = await import('../apps/web/core/ai/runModel');
  const { reserveAiRequest } = await import('@/lib/billing/cost-guard.server');
  const { runFreeBuilder } = await import('@/lib/builder/free-generation.server');
  const { logUsage } = await import('@/lib/usage/log');
  const { requireUserId } = await import('@/lib/auth');
  vi.mocked(requireUserId).mockResolvedValue('test-user');
  vi.mocked(reserveAiRequest).mockResolvedValue({ plan: 'free' } as any);
  vi.mocked(logUsage).mockResolvedValue(undefined as any);
  return { POST, runModel: vi.mocked(runModel),
    reserveAiRequest: vi.mocked(reserveAiRequest), runFreeBuilder: vi.mocked(runFreeBuilder),
    logUsage: vi.mocked(logUsage), requireUserId: vi.mocked(requireUserId) };
}

function request(batchPrompt: string) {
  return new Request('https://dreammakerhub.website/api/wonder-build/template-library/generate-batch', {
    method: 'POST', body: JSON.stringify({ category: 'AI Generated', batchPrompt }),
  });
}

const template = { id: 'ai-site', name: 'Coffee Shop', category: 'AI Generated',
  elements: [{ type: 'section', content: 'Coffee' }] };

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('WonderBuild template generation with atomic metering', () => {
  it('reserves usage before exactly one paid-provider attempt', async () => {
    const { POST, runModel, reserveAiRequest, logUsage } = await setup();
    vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-private-key');
    runModel.mockResolvedValue({ text: JSON.stringify([template]), tokens: 100 });
    const response = await POST(request('Build a coffee website') as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, count: 1, templates: [template] });
    expect(reserveAiRequest).toHaveBeenCalledWith('test-user', expect.any(Number), 4096);
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({
      singleProviderAttempt: true, maxTokens: 4096,
      messages: [expect.objectContaining({ role: 'user', content: expect.stringContaining('Build a coffee website') })],
    }));
    expect(reserveAiRequest.mock.invocationCallOrder[0]).toBeLessThan(runModel.mock.invocationCallOrder[0]);
    expect(logUsage).toHaveBeenCalledOnce();
  });

  it('refuses to call a provider when quota reservation fails', async () => {
    const { POST, runModel, reserveAiRequest } = await setup();
    vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'true');
    vi.stubEnv('GROQ_API_KEY', 'test-provider');
    const { CostGateError } = await import('@/lib/billing/cost-guard.server');
    reserveAiRequest.mockRejectedValue(new CostGateError('Monthly limit reached', 429));
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(429);
    expect(runModel).not.toHaveBeenCalled();
  });

  it('uses the existing free-beta reservation and never invokes the paid model router', async () => {
    const { POST, runModel, reserveAiRequest, runFreeBuilder } = await setup();
    vi.stubEnv('FREE_BUILDER_AI_ENABLED', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-free-provider');
    runFreeBuilder.mockResolvedValue(Response.json({ text: JSON.stringify([template]) }) as any);
    const response = await POST(request('A site with a home page') as any);
    expect(response.status).toBe(200);
    expect(runFreeBuilder).toHaveBeenCalledWith('test-user', expect.stringContaining('A site with a home page'));
    expect(reserveAiRequest).not.toHaveBeenCalled();
    expect(runModel).not.toHaveBeenCalled();
  });

  it('propagates free beta quota denial without a second model attempt', async () => {
    const { POST, runModel, runFreeBuilder } = await setup();
    vi.stubEnv('FREE_BUILDER_AI_ENABLED', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-free-provider');
    runFreeBuilder.mockResolvedValue(Response.json({ code: 'COST_GUARD', error: 'Limit reached' }, { status: 429 }) as any);
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(429);
    expect(runModel).not.toHaveBeenCalled();
  });

  it('does not reserve usage when no eligible provider exists', async () => {
    const { POST, runModel, reserveAiRequest } = await setup();
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(503);
    expect(runModel).not.toHaveBeenCalled();
    expect(reserveAiRequest).not.toHaveBeenCalled();
  });

  it('requires a validated user identity before reserving', async () => {
    const { POST, requireUserId, reserveAiRequest } = await setup();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    requireUserId.mockResolvedValue(null);
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(401);
    expect(reserveAiRequest).not.toHaveBeenCalled();
  });

  it('does not leak private provider details when generation fails', async () => {
    const { POST, runModel } = await setup();
    vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-private-key');
    runModel.mockResolvedValue({ text: '', tokens: 0, error: 'test-private-key upstream denied' });
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('test-private-key');
  });

  it('refuses empty templates instead of creating a bogus project', async () => {
    const { POST, runModel } = await setup();
    vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'true');
    vi.stubEnv('OPENROUTER_API_KEY', 'test-private-key');
    runModel.mockResolvedValue({ text: '[{"name":"Empty","elements":[]}]', tokens: 100 });
    expect((await POST(request('Build a site') as any)).status).toBe(502);
  });
});
