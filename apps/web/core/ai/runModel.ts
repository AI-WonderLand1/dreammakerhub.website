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

const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

/** Statuses where trying the free default model makes sense (no credits, bad slug, rate limit). */
const FALLBACK_STATUSES = new Set([402, 403, 404, 429]);

function normalizeModel(model?: string): string {
  if (!model) return DEFAULT_MODEL;
  let m = model.trim();
  if (m.startsWith('openrouter/')) m = m.slice('openrouter/'.length);
  return m || DEFAULT_MODEL;
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: RunModelMessage[],
  opts: RunModelOptions
): Promise<{ ok: boolean; status?: number; text?: string; tokens?: number }> {
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

  if (!res.ok) return { ok: false, status: res.status };

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
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
    return { text: '', tokens: 0, error: 'AI provider not configured' };
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

    // Auto-fallback to the free default when the requested model can't serve.
    if (!out.ok && FALLBACK_STATUSES.has(out.status!) && model !== DEFAULT_MODEL) {
      logger.warn(`runModel: ${model} unavailable (${out.status}), falling back to ${DEFAULT_MODEL}`);
      out = await callOpenRouter(apiKey, DEFAULT_MODEL, messages, opts);
    }

    if (!out.ok) {
      const hint =
        out.status === 401
          ? ' — check OPENROUTER_API_KEY'
          : out.status === 402
            ? ' — OpenRouter account needs credits'
            : '';
      logger.error(`runModel: OpenRouter error ${out.status}${hint} on ${model}`);
      return { text: '', tokens: 0, error: `AI provider error (${out.status})${hint}` };
    }

    return { text: out.text ?? '', tokens: out.tokens ?? 0 };
  } catch (err: any) {
    logger.error('runModel failed:', err?.message);
    return { text: '', tokens: 0, error: 'AI request failed' };
  }
}
