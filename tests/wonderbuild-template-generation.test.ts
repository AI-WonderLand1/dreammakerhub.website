import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock('../apps/web/app/api/wonder-build/template-library/shared', () => ({
  requireTemplateUser: vi.fn(async () => ({ userId: 'test-user', response: null })),
  extractJsonArray: (raw: string) => JSON.parse(raw),
}));
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
  const { requireTemplateUser } = await import('../apps/web/app/api/wonder-build/template-library/shared');
  vi.mocked(requireTemplateUser).mockResolvedValue({ userId: 'test-user', response: null });
  vi.mocked(reserveAiRequest).mockResolvedValue({ plan: 'free' } as any);
  vi.mocked(logUsage).mockResolvedValue(undefined as any);
  return { POST, runModel: vi.mocked(runModel),
    reserveAiRequest: vi.mocked(reserveAiRequest), runFreeBuilder: vi.mocked(runFreeBuilder),
    logUsage: vi.mocked(logUsage), requireTemplateUser: vi.mocked(requireTemplateUser) };
}

function request(batchPrompt: string, extra: Record<string, unknown> = {}) {
  return new Request('https://dreammakerhub.website/api/wonder-build/template-library/generate-batch', {
    method: 'POST', body: JSON.stringify({ category: 'AI Generated', batchPrompt, ...extra }),
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
    const { POST, requireTemplateUser, reserveAiRequest } = await setup();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    requireTemplateUser.mockResolvedValue({ userId: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) as any });
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

describe('WonderBuild single and multi-template contract', () => {
  it('keeps every requested batch variant and uses one bounded provider attempt', async () => {
    const { POST, runModel, reserveAiRequest } = await setup();
    vi.stubEnv('BILLABLE_OPERATIONS_ENABLED', 'true'); vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const variants = ['Minimal', 'Bold', 'Editorial', 'Magazine', 'Product', 'Portfolio', 'Checkout', 'Launch'];
    const generated = variants.map((variant, i) => ({ ...template, id: `variant-${i}`, name: variant }));
    runModel.mockResolvedValue({ text: JSON.stringify(generated), tokens: 3000 });
    const response = await POST(request('Generate 8 templates', { templateCount: 8, variants }) as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ count: 8, templates: generated });
    expect(runModel).toHaveBeenCalledOnce(); expect(reserveAiRequest).toHaveBeenCalledOnce();
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({ maxTokens: 4096, singleProviderAttempt: true,
      messages: [expect.objectContaining({ content: expect.stringContaining('exactly 8 valid templates') })] }));
  });

  it('derives batch size from existing clients that send variants without a count', async () => {
    const { POST, runFreeBuilder } = await setup();
    vi.stubEnv('FREE_BUILDER_AI_ENABLED', 'true'); vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const generated = [template, { ...template, id: 'other', name: 'Other' }];
    runFreeBuilder.mockResolvedValue(Response.json({ text: JSON.stringify(generated) }) as any);
    expect((await POST(request('Generate two', { variants: ['Minimal', 'Bold'] }) as any)).status).toBe(200);
    expect(runFreeBuilder).toHaveBeenCalledWith('test-user', expect.stringContaining('exactly 2 valid templates'));
  });

  it('rejects a partial collection instead of reporting false success', async () => {
    const { POST, runModel } = await setup(); vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    runModel.mockResolvedValue({ text: JSON.stringify([template]), tokens: 100 });
    const response = await POST(request('Generate six', { templateCount: 6 }) as any);
    expect(response.status).toBe(502); expect(await response.json()).toMatchObject({ code: 'AI_INCOMPLETE_BATCH' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each([
    { templateCount: 0 }, { templateCount: 9 }, { templateCount: 1.5 }, { templateCount: '2' },
    { variants: [] }, { variants: ['Same', 'Same'] }, { variants: ['ok', null] },
    { templateCount: 1, variants: ['First', 'Second'] },
  ])('rejects invalid counts or variants before charging usage: %j', async extra => {
    const { POST, reserveAiRequest, runModel } = await setup(); vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    expect((await POST(request('Generate', extra) as any)).status).toBe(400);
    expect(reserveAiRequest).not.toHaveBeenCalled(); expect(runModel).not.toHaveBeenCalled();
  });

  it('reserves under the exact smoke principal accepted by the auth gate', async () => {
    const { POST, requireTemplateUser, reserveAiRequest, runModel } = await setup();
    requireTemplateUser.mockResolvedValue({ userId: 'smoke-test-principal', response: null });
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key'); runModel.mockResolvedValue({ text: JSON.stringify([template]), tokens: 100 });
    expect((await POST(request('Generate one', { templateCount: 1 }) as any)).status).toBe(200);
    expect(reserveAiRequest).toHaveBeenCalledWith('smoke-test-principal', expect.any(Number), 4096);
    expect(requireTemplateUser).toHaveBeenCalledOnce();
  });
});

describe('WonderBuild generated-result safety', () => {
  it('rejects duplicate IDs instead of claiming a complete distinct batch', async () => {
    const { POST, runModel } = await setup(); vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    runModel.mockResolvedValue({ text: JSON.stringify([template, template]), tokens: 100 });
    expect((await POST(request('Generate two', { templateCount: 2 }) as any)).status).toBe(502);
  });
  it('keeps upstream exception details out of both responses and application logs', async () => {
    const { POST, runModel } = await setup(); vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    runModel.mockRejectedValue(new Error('private-provider-key upstream account details'));
    const response = await POST(request('Generate one') as any); expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('private-provider-key');
    const { logger } = await import('@/lib/logger'); expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain('private-provider-key');
  });
});
