import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) },
}));
vi.mock('../apps/web/app/api/wonder-build/template-library/shared', () => ({
  requireUser: vi.fn(async () => null),
  extractJsonArray: (raw: string) => JSON.parse(raw),
}));
vi.mock('../apps/web/core/ai/runModel', () => ({ runModel: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

const providerKeys = [
  'OPENROUTER_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY', 'CEREBRAS_API_KEY',
];

async function setup() {
  vi.resetModules();
  vi.clearAllMocks();
  for (const key of providerKeys) vi.stubEnv(key, '');
  const { POST } = await import('../apps/web/app/api/wonder-build/template-library/generate-batch/route');
  const { runModel } = await import('../apps/web/core/ai/runModel');
  return { POST, runModel: vi.mocked(runModel) };
}

function request(batchPrompt: string) {
  return new Request('https://dreammakerhub.website/api/wonder-build/template-library/generate-batch', {
    method: 'POST',
    body: JSON.stringify({ category: 'AI Generated', batchPrompt }),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('WonderBuild AI template creation', () => {
  it('builds a usable template with OpenRouter as the only configured provider', async () => {
    const { POST, runModel } = await setup();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-private-key');
    const template = { id: 'ai-site', name: 'Coffee Shop', elements: [{ type: 'section', content: 'Coffee' }] };
    runModel.mockResolvedValue({ text: JSON.stringify([template]), tokens: 100 });

    const response = await POST(request('Build a coffee website') as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, count: 1, templates: [template] });
    expect(runModel).toHaveBeenCalledWith(expect.objectContaining({
      messages: [{ role: 'user', content: 'Build a coffee website' }],
    }));
  });

  it('reports missing server providers instead of pretending to build', async () => {
    const { POST, runModel } = await setup();
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(503);
    expect(runModel).not.toHaveBeenCalled();
  });

  it('does not leak a provider credential or upstream error to the browser', async () => {
    const { POST, runModel } = await setup();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-private-key');
    runModel.mockResolvedValue({ text: '', tokens: 0, error: 'test-private-key upstream account error' });
    const response = await POST(request('Build a site') as any);
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain('test-private-key');
    expect(text).not.toContain('upstream account error');
  });

  it('refuses an empty template instead of opening a blank AI project', async () => {
    const { POST, runModel } = await setup();
    vi.stubEnv('OPENROUTER_API_KEY', 'test-private-key');
    runModel.mockResolvedValue({ text: '[{"name":"Empty","elements":[]}]', tokens: 100 });
    expect((await POST(request('Build a site') as any)).status).toBe(502);
  });
});
