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

type ProviderResult = {
  ok: boolean;
  status?: number;
  text?: string;
  tokens?: number;
  error?: string;
};

const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Retry the free OpenRouter model for the common cases where Auto Router or a
// requested model cannot serve the request. If OpenRouter still cannot serve
// the request, the platform Gemini key is used as a provider-level fallback.
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
): Promise<ProviderResult> {
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

async function callGemini(
  apiKey: string,
  messages: RunModelMessage[],
  opts: RunModelOptions
): Promise<ProviderResult> {
  const systemText = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .filter(Boolean)
    .join('\n\n');

  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  if (!contents.length) {
    contents.push({ role: 'user', parts: [{ text: '' }] });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents,
        ...(systemText
          ? { systemInstruction: { parts: [{ text: systemText }] } }
          : {}),
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          ...(opts.maxTokens ? { maxOutputTokens: opts.maxTokens } : {}),
        },
      }),
    }
  );

  const data = await res.json().catch(() => null) as any;
  const providerError = providerErrorMessage(data);

  if (!res.ok || providerError) {
    const providerCode = Number(data?.error?.code);
    return {
      ok: false,
      status: Number.isFinite(providerCode) && providerCode >= 400 ? providerCode : res.status,
      error: providerError || `Gemini request failed (${res.status})`,
    };
  }

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts
        .map((part: { text?: unknown }) => (typeof part?.text === 'string' ? part.text : ''))
        .join('')
        .trim()
    : '';

  if (!text) {
    return { ok: false, status: 502, error: 'Gemini returned an empty response' };
  }

  const tokens: number =
    data?.usageMetadata?.totalTokenCount ??
    Math.ceil(messages.reduce((n, m) => n + m.content.length, text.length) / 4);

  return { ok: true, text, tokens };
}

/**
 * Real AI completion with OpenRouter as the primary provider and Gemini as the
 * production fallback. Accepts a plain prompt string or
 * { model, messages, system, temperature, maxTokens }.
 */
export async function runModel(
  input: string | RunModelOptions = ''
): Promise<RunModelResult> {
  const opts: RunModelOptions =
    typeof input === 'string' ? { messages: [{ role: 'user', content: input }] } : input;

  const openRouterKey = process.env.OPENROUTER_API_KEY || opts.userApiKey;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  const messages: RunModelMessage[] = [
    ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
    ...(opts.messages && opts.messages.length
      ? opts.messages
      : [{ role: 'user', content: '' }]),
  ];

  const useGemini = async (reason: string): Promise<RunModelResult> => {
    if (!geminiKey) {
      return { text: '', tokens: 0, error: reason };
    }

    logger.warn(`runModel: ${reason}; using Gemini fallback`);
    const fallback = await callGemini(geminiKey, messages, opts);
    if (fallback.ok) {
      return { text: fallback.text ?? '', tokens: fallback.tokens ?? 0 };
    }

    const error = fallback.error || `Gemini provider error (${fallback.status ?? 'unknown'})`;
    logger.error(`runModel: Gemini fallback failed: ${error}`);
    return { text: '', tokens: 0, error: `AI providers failed: ${reason}; Gemini: ${error}` };
  };

  if (!openRouterKey) {
    if (!geminiKey) {
      logger.error('runModel: no platform AI provider key configured');
      return {
        text: '',
        tokens: 0,
        error: 'AI provider is not configured: OPENROUTER_API_KEY and GEMINI_API_KEY are missing',
      };
    }

    return useGemini('OPENROUTER_API_KEY is missing');
  }

  const model = normalizeModel(opts.model);

  try {
    let out = await callOpenRouter(openRouterKey, model, messages, opts);

    if (!out.ok && FALLBACK_STATUSES.has(out.status ?? 0) && model !== DEFAULT_MODEL) {
      logger.warn(`runModel: ${model} unavailable (${out.status}), falling back to ${DEFAULT_MODEL}`);
      out = await callOpenRouter(openRouterKey, DEFAULT_MODEL, messages, opts);
    }

    if (!out.ok) {
      const hint =
        out.status === 401
          ? 'OpenRouter authentication failed'
          : out.status === 402
            ? 'OpenRouter account needs credits or model access'
            : out.error || `OpenRouter provider error (${out.status ?? 'unknown'})`;

      if (geminiKey) {
        return useGemini(hint);
      }

      const error = `${out.error || `AI provider error (${out.status ?? 'unknown'})`}${
        out.status === 401
          ? ' Check OPENROUTER_API_KEY.'
          : out.status === 402
            ? ' OpenRouter account needs credits or access to a free model.'
            : ''
      }`;
      logger.error(`runModel: ${error}`);
      return { text: '', tokens: 0, error };
    }

    return { text: out.text ?? '', tokens: out.tokens ?? 0 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown provider error';
    if (geminiKey) {
      try {
        return await useGemini(`OpenRouter request failed: ${message}`);
      } catch (fallbackErr: unknown) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown Gemini error';
        logger.error('runModel Gemini fallback failed:', fallbackMessage);
        return { text: '', tokens: 0, error: `AI request failed: ${fallbackMessage}` };
      }
    }

    logger.error('runModel failed:', message);
    return { text: '', tokens: 0, error: `AI request failed: ${message}` };
  }
}
