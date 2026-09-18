import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock('@/lib/auth', () => ({ requireUserId: vi.fn() }));
vi.mock('@/lib/ai/models', () => ({ resolveModel: vi.fn() }));
vi.mock('../apps/web/core/ai/runModel', () => ({ runModel: vi.fn() }));
vi.mock('@/lib/usage/log', () => ({ logUsage: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/app/utils/supabase/server', () => ({ createClient: vi.fn() }));

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
  const { createClient } = await import('@/app/utils/supabase/server');
  vi.mocked(requireUserId).mockResolvedValue('test-user');
  vi.mocked(resolveModel).mockReturnValue({
    model: tier === 'premium' ? 'anthropic/claude-sonnet-4' : 'meta-llama/llama-3.3-70b-instruct:free',
    tier,
    name: tier === 'premium' ? 'SimpleRick' : 'Alice',
    systemPrompt: 'You are an assistant.',
  });
  vi.mocked(createClient).mockResolvedValue({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
      data: { subscription_tier: 'pro' }, error: null,
    }) }) }) }),
  } as any);
  const { POST } = await import('../apps/web/app/api/chat/route');
  return { POST, runModel: vi.mocked(runModel), logUsage: vi.mocked(logUsage), requireUserId: vi.mocked(requireUserId) };
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
  it('uses a configured Gemini fallback when OpenRouter is missing', async () => {
    const { POST, runModel, logUsage } = await setup();
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-secret');
    runModel.mockResolvedValue({ text: 'Here is how to start.', tokens: 42 });

    const response = await POST(request({
      message: 'Help me make a website',
      history: [{ role: 'user', content: 'Hello' }],
    }) as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, text: 'Here is how to start.', tier: 'free' });
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({
      messages: [
        { role: 'system', content: 'You are an assistant.' },
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Help me make a website' },
      ],
    }));
    expect(logUsage).toHaveBeenCalledWith(expect.objectContaining({ userId: 'test-user', tokensUsed: 42 }));
  });

  it('returns 503 and does not call a provider when no keys exist', async () => {
    const { POST, runModel } = await setup();
    const response = await POST(request() as any);
    expect(response.status).toBe(503);
    expect(runModel).not.toHaveBeenCalled();
  });

  it('never exposes upstream credentials or error details in a failed response', async () => {
    const { POST, runModel, logUsage } = await setup();
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-private-secret');
    runModel.mockResolvedValue({ text: '', tokens: 0, error: 'test-private-secret upstream error' });
    const response = await POST(request() as any);
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain('test-private-secret');
    expect(text).not.toContain('upstream error');
    expect(logUsage).not.toHaveBeenCalled();
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
