import { logger } from '@/lib/logger';

export type RunModelMessage = { role: string; content: string };

export type RunModelOptions = {
  model?: string;
  messages?: RunModelMessage[];
  system?: string;
  temperature?: number;
  maxTokens?: number;
  userApiKey?: string;
};

export type RunModelResult = {
  text: string;
  tokens: number;
  error?: string;
};

type OpenRouterResult = {
  ok: boolean;
  status?: number;
  text?: string;
  tokens?: number;
  error?: string;
};

const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

// Retry the free model for the common cases where Auto Router or a requested
// model cannot serve the request. An invalid key (401) is intentionally not
// retried because changing models cannot fix authentication.
const FALLBACK_STATUSES = new Set([400, 402, 403, 404, 408, 409, 429, 500, 502, 503, 504]);

function normalizeModel(model?: string): string {
  if (!model) return DEFAULT_MODEL;
  let m = model.trim();
  if (m.startsWith('openrouter/')) m = m.slice('openrouter/'.length);
  return m || DEFAULT_MODEL;
}

function providerErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const error = (data as { error?: unknown }).error;
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return undefined;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: RunModelMessage[],
  opts: RunModelOptions
): Promise<OpenRouterResult> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'https://dreammakerhub.website',
      'X-Title': 'AI Wonderland',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      stream: false,
    }),
  });

  const data = await res.json().catch(() => null) as any;
  const providerError = providerErrorMessage(data);

  if (!res.ok || providerError) {
    const providerCode = Number(data?.error?.code);
    return {
      ok: false,
      status: Number.isFinite(providerCode) && providerCode >= 400 ? providerCode : res.status,
      error: providerError || `OpenRouter request failed (${res.status})`,
    };
  }

  const text = typeof data?.choices?.[0]?.message?.content === 'string'
    ? data.choices[0].message.content.trim()
    : '';

  if (!text) {
    return { ok: false, status: 502, error: 'OpenRouter returned an empty response' };
  }

  const tokens: number =
    data?.usage?.total_tokens ??
    Math.ceil(messages.reduce((n, m) => n + m.content.length, text.length) / 4);

  return { ok: true, text, tokens };
}

/**
 * Real AI completion via OpenRouter.
 * Accepts a plain prompt string or { model, messages, system, temperature, maxTokens }.
 * Model ids may be "openrouter/<vendor>/<slug>" or bare "<vendor>/<slug>".
 */
export async function runModel(
  input: string | RunModelOptions = ''
): Promise<RunModelResult> {
  const opts: RunModelOptions =
    typeof input === 'string' ? { messages: [{ role: 'user', content: input }] } : input;

  const apiKey = process.env.OPENROUTER_API_KEY || opts.userApiKey;
  if (!apiKey) {
    logger.error('runModel: OPENROUTER_API_KEY missing');
    return { text: '', tokens: 0, error: 'AI provider is not configured: OPENROUTER_API_KEY is missing' };
  }

  const messages: RunModelMessage[] = [
    ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
    ...(opts.messages && opts.messages.length
      ? opts.messages
      : [{ role: 'user', content: '' }]),
  ];

  const model = normalizeModel(opts.model);

  try {
    let out = await callOpenRouter(apiKey, model, messages, opts);

    if (!out.ok && FALLBACK_STATUSES.has(out.status ?? 0) && model !== DEFAULT_MODEL) {
      logger.warn(`runModel: ${model} unavailable (${out.status}), falling back to ${DEFAULT_MODEL}`);
      out = await callOpenRouter(apiKey, DEFAULT_MODEL, messages, opts);
    }

    if (!out.ok) {
      const hint =
        out.status === 401
          ? ' Check OPENROUTER_API_KEY.'
          : out.status === 402
            ? ' OpenRouter account needs credits or access to a free model.'
            : '';
      const error = `${out.error || `AI provider error (${out.status ?? 'unknown'})`}${hint}`;
      logger.error(`runModel: ${error}`);
      return { text: '', tokens: 0, error };
    }

    return { text: out.text ?? '', tokens: out.tokens ?? 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown provider error';
    logger.error('runModel failed:', message);
    return { text: '', tokens: 0, error: `AI request failed: ${message}` };
  }
}
