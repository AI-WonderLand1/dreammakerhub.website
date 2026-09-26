import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock('@/lib/auth', () => ({ requireUserId: vi.fn() }));
vi.mock('@/lib/ai/models', () => ({ resolveModel: vi.fn() }));
vi.mock('../apps/web/core/ai/runModel', () => ({ runModel: vi.fn() }));
vi.mock('@/lib/usage/log', () => ({ logUsage: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/billing/cost-guard.server', () => {
  class CostGateError extends Error {
    constructor(message: string, readonly status = 503) {
      super(message);
    }
  }
  return {
    CostGateError,
    costGateResponse: (error: unknown) =>
      Response.json({ error: error instanceof Error ? error.message : 'Usage unavailable' }, { status: 503 }),
    verifiedCostPlan: vi.fn(),
    reserveAiRequest: vi.fn(),
  };
});
vi.mock('@/lib/ai/mem0Client', () => ({ storeConfessionToMem0: vi.fn() }));

const providerKeys = [
  'OPENROUTER_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY', 'CEREBRAS_API_KEY',
];

async function setup(tier: 'free' | 'premium' = 'free') {
  vi.resetModules();
  vi.clearAllMocks();
  for (const key of providerKeys) vi.stubEnv(key, '');
  const { requireUserId } = await import('@/lib/auth');
  const { resolveModel } = await import('@/lib/ai/models');
  const { runModel } = await import('../apps/web/core/ai/runModel');
  const { logUsage } = await import('@/lib/usage/log');
  const { verifiedCostPlan, reserveAiRequest } = await import('@/lib/billing/cost-guard.server');
  const { storeConfessionToMem0 } = await import('@/lib/ai/mem0Client');
  vi.mocked(requireUserId).mockResolvedValue('test-user');
  vi.mocked(resolveModel).mockReturnValue({
    model: tier === 'premium' ? 'anthropic/claude-sonnet-4' : 'meta-llama/llama-3.3-70b-instruct:free',
    tier,
    name: tier === 'premium' ? 'SimpleRick' : 'Alice',
    systemPrompt: 'You are an assistant.',
  });
  vi.mocked(storeConfessionToMem0).mockResolvedValue(false);
  vi.mocked(verifiedCostPlan).mockResolvedValue(tier === 'premium' ? 'pro' : 'free');
  vi.mocked(reserveAiRequest).mockResolvedValue({
    plan: tier === 'premium' ? 'pro' : 'free', estimatedTokens: 1474,
  });
  const { POST } = await import('../apps/web/app/api/chat/route');
  return {
    POST,
    runModel: vi.mocked(runModel),
    logUsage: vi.mocked(logUsage),
    requireUserId: vi.mocked(requireUserId),
    storeConfessionToMem0: vi.mocked(storeConfessionToMem0),
    verifiedCostPlan: vi.mocked(verifiedCostPlan),
    reserveAiRequest: vi.mocked(reserveAiRequest),
  };
}

function request(body: unknown = { message: 'Help me make a website' }) {
  return new Request('https://dreammakerhub.website/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('sitewide assistant provider configuration', () => {
  it('uses a configured Gemini fallback and passes history and a concise system prompt', async () => {
    const { POST, runModel, logUsage, storeConfessionToMem0, reserveAiRequest } = await setup();
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-secret');
    runModel.mockResolvedValue({ text: 'Here is how to start.', tokens: 42 });

    const response = await POST(request({
      message: 'Help me make a website',
      history: [{ role: 'user', content: 'Hello' }],
    }) as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true, text: 'Here is how to start.', tier: 'free', confessionsStored: false,
      confessions: [{ title: 'Assistant response', projectId: 'sitewide' }],
    });
    expect(reserveAiRequest).toHaveBeenCalledWith('test-user', expect.any(Number), 450);
    expect(reserveAiRequest.mock.invocationCallOrder[0]).toBeLessThan(runModel.mock.invocationCallOrder[0]);
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({
      maxTokens: 450,
      singleProviderAttempt: true,
      system: expect.stringContaining('Answer normal questions directly and briefly'),
      messages: [{ role: 'user', content: expect.stringContaining('Current user message:\nHelp me make a website') }],
    }));
    expect(runModel.mock.calls[0][0].messages[0].content).toContain('User: Hello');
    expect(logUsage).toHaveBeenCalledWith(expect.objectContaining({ userId: 'test-user', tokensUsed: 42 }));
    expect(storeConfessionToMem0).toHaveBeenCalledOnce();
  });

  it('rejects requests without available server-side usage accounting before contacting AI', async () => {
    const { POST, runModel, reserveAiRequest } = await setup();
    const { CostGateError } = await import('@/lib/billing/cost-guard.server');
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-secret');
    reserveAiRequest.mockRejectedValue(new CostGateError('Usage accounting unavailable'));
    const response = await POST(request() as any);
    expect(response.status).toBe(503);
    expect(runModel).not.toHaveBeenCalled();
  });

  it('includes history in the per-request input budget', async () => {
    const { POST, runModel, reserveAiRequest } = await setup();
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-secret');
    const response = await POST(request({
      message: 'short',
      history: [{ role: 'user', content: 'x'.repeat(7000) }, { role: 'assistant', content: 'y'.repeat(6000) }],
    }) as any);
    expect(response.status).toBe(413);
    expect(runModel).not.toHaveBeenCalled();
    expect(reserveAiRequest).not.toHaveBeenCalled();
  });

  it('returns 503 and does not call a provider when no keys exist', async () => {
    const { POST, runModel, storeConfessionToMem0 } = await setup();
    const response = await POST(request() as any);
    expect(response.status).toBe(503);
    expect(runModel).not.toHaveBeenCalled();
    expect(storeConfessionToMem0).not.toHaveBeenCalled();
  });

  it('never exposes upstream credentials or error details in a failed response', async () => {
    const { POST, runModel, logUsage, storeConfessionToMem0 } = await setup();
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-private-secret');
    runModel.mockResolvedValue({ text: '', tokens: 0, error: 'test-private-secret upstream error' });
    const response = await POST(request() as any);
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain('test-private-secret');
    expect(text).not.toContain('upstream error');
    expect(logUsage).not.toHaveBeenCalled();
    expect(storeConfessionToMem0).not.toHaveBeenCalled();
  });

  it('does not substitute a free model for a paid model without OpenRouter', async () => {
    const { POST, runModel } = await setup('premium');
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-secret');
    const response = await POST(request() as any);
    expect(response.status).toBe(503);
    expect(runModel).not.toHaveBeenCalled();
  });

  it('keeps authentication required for the AI worker chat', async () => {
    const { POST, requireUserId, runModel } = await setup();
    requireUserId.mockResolvedValue(null);
    const response = await POST(request() as any);
    expect(response.status).toBe(401);
    expect(runModel).not.toHaveBeenCalled();
  });
});
