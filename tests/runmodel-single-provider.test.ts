import { afterEach, describe, expect, it, vi } from 'vitest';
import { runModel } from '../apps/web/core/ai/runModel';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function providerEnv() {
  vi.stubEnv('OPENROUTER_API_KEY', 'test-openrouter-key');
  vi.stubEnv('GROQ_API_KEY', 'test-groq-key');
  vi.stubEnv('GEMINI_API_KEY', '');
  vi.stubEnv('GOOGLE_AI_API_KEY', '');
  vi.stubEnv('CEREBRAS_API_KEY', '');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('provider attempts and atomic cost reservations', () => {
  it('does not call Groq or retry OpenRouter when a metered one-attempt request fails', async () => {
    providerEnv();
    const call = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'Unavailable' } }),
    });
    vi.stubGlobal('fetch', call);
    const result = await runModel({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: 'hello' }],
      maxTokens: 450,
      singleProviderAttempt: true,
    });
    expect(result.error).toBeTruthy();
    expect(call).toHaveBeenCalledTimes(1);
    expect(String(call.mock.calls[0][0])).toContain('openrouter.ai');
  });

  it('uses only one configured Gemini provider when OpenRouter and Groq are missing', async () => {
    providerEnv();
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('GROQ_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    vi.stubEnv('GOOGLE_AI_API_KEY', 'a-different-fallback-key');
    const call = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Gemini works' }] } }],
        usageMetadata: { totalTokenCount: 12 },
      }),
    });
    vi.stubGlobal('fetch', call);
    const result = await runModel({
      messages: [{ role: 'user', content: 'hello' }],
      maxTokens: 450,
      singleProviderAttempt: true,
    });
    expect(result.text).toBe('Gemini works');
    expect(call).toHaveBeenCalledTimes(1);
    expect(String(call.mock.calls[0][0])).toContain('generativelanguage.googleapis.com');
  });

  it('preserves explicitly chosen fallback behavior for non-metered callers', async () => {
    providerEnv();
    const call = vi.fn()
      .mockResolvedValueOnce({
        ok: false, status: 503, json: async () => ({ error: { message: 'Unavailable' } }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Groq fallback' } }],
          usage: { total_tokens: 10 },
        }),
      });
    vi.stubGlobal('fetch', call);
    const result = await runModel({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: 'hello' }],
      maxTokens: 450,
    });
    expect(result.text).toBe('Groq fallback');
    expect(call).toHaveBeenCalledTimes(2);
  });
});
