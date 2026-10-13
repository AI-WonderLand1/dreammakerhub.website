import { NextRequest, NextResponse } from 'next/server';
import { requireUser, extractJsonArray } from '../shared';
import { requireUserId } from '@/lib/auth';
import { runModel } from '../../../../../core/ai/runModel';
import { runFreeBuilder } from '@/lib/builder/free-generation.server';
import { CostGateError, costGateResponse, reserveAiRequest } from '@/lib/billing/cost-guard.server';
import { logUsage } from '@/lib/usage/log';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OUTPUT_BUDGET = 4096;
// Provider output must fit the metering reservation. Keep this instruction
// compact so the existing free beta can generate a useful single template.
const systemInstruction = `You are WonderBuild AI, a website template generator.
Return ONLY a minified JSON array containing one valid template per request.
Every template must have a name, id, category and nonempty elements array.
Use 4-6 meaningful sections, plus nav/footer where appropriate. Limit verbosity
and do not repeat descriptions. Allowed elements: section, div, heading, text,
button, image, grid, card, nav, footer. Use camelCase CSS-in-JS style keys.
No code fences, generic placeholder text, or invented provider images.`;

function hasPlatformProvider(): boolean {
  return [
    process.env.OPENROUTER_API_KEY, process.env.GROQ_API_KEY,
    process.env.GEMINI_API_KEY, process.env.GOOGLE_AI_API_KEY,
    process.env.CEREBRAS_API_KEY,
  ].some((key) => Boolean(key?.trim()));
}

/**
 * Template generation uses the same accounting as in-editor Alice actions.
 * Never fall back to a paid model without another independent reservation.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireUser(req);
  if (authResult) return authResult;

  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to generate websites.', code: 'AUTH_REQUIRED' }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const category = body && typeof body === 'object' && 'category' in body ? body.category : undefined;
  const batchPrompt = body && typeof body === 'object' && 'batchPrompt' in body ? body.batchPrompt : undefined;
  if (typeof category !== 'string' || !category.trim() || typeof batchPrompt !== 'string' || !batchPrompt.trim()) {
    return NextResponse.json({ error: 'Missing required category or batchPrompt parameter.' }, { status: 400 });
  }
  const message = `${systemInstruction}\n\n${batchPrompt}`;
  if (message.length > 12000) {
    return NextResponse.json({ error: 'Template request is too long. Shorten it and retry.' }, { status: 413 });
  }

  const freeBeta = process.env.FREE_BUILDER_AI_ENABLED === 'true' &&
    process.env.BILLABLE_OPERATIONS_ENABLED !== 'true';
  if (freeBeta ? !process.env.OPENROUTER_API_KEY?.trim() : !hasPlatformProvider()) {
    return NextResponse.json({
      error: 'Website generation is unavailable: no eligible server AI provider is configured.',
      code: 'AI_NOT_CONFIGURED',
    }, { status: 503 });
  }

  try {
    let raw = '';
    if (freeBeta) {
      // The shared free path atomically reserves exactly one per-user request
      // before calling the OpenRouter free model; never invokes paid fallbacks.
      const response = await runFreeBuilder(userId, message);
      if (!response.ok) return response;
      const result = await response.json() as { text?: unknown };
      raw = typeof result.text === 'string' ? result.text : '';
    } else {
      // Pause automatically if BILLABLE_OPERATIONS_ENABLED or the atomic DB
      // reservation is unavailable. Quota is charged BEFORE model execution.
      await reserveAiRequest(userId, message.length, OUTPUT_BUDGET);
      const result = await runModel({
        messages: [{ role: 'user', content: message }],
        temperature: 0.35,
        maxTokens: OUTPUT_BUDGET,
        singleProviderAttempt: true,
      });
      if (result.error || !result.text?.trim()) {
        logger.warn('WonderBuild AI template provider unavailable after reservation');
        return NextResponse.json({ error: 'The AI provider could not generate a website. Retry later.' }, { status: 502 });
      }
      raw = result.text;
      await logUsage({
        userId, action: 'ai.token', apiCalls: 1,
        tokensUsed: result.tokens || Math.ceil((message.length + raw.length) / 4),
      });
    }

    if (!raw.trim()) {
      return NextResponse.json({ error: 'AI returned no website template.' }, { status: 502 });
    }
    let templates: unknown[];
    try {
      templates = extractJsonArray(raw);
    } catch {
      logger.warn('WonderBuild AI provider returned invalid template JSON.');
      return NextResponse.json({ error: 'AI returned invalid website JSON. Try a shorter prompt.' }, { status: 502 });
    }
    if (!templates.length || templates.some((template) =>
      !template || typeof template !== 'object' ||
      !('elements' in template) || !Array.isArray(template.elements) || template.elements.length === 0
    )) {
      return NextResponse.json({ error: 'AI returned an empty or invalid website template.' }, { status: 502 });
    }
    return NextResponse.json({ success: true, count: templates.length, templates }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: unknown) {
    if (err instanceof CostGateError) return costGateResponse(err);
    logger.error('WonderBuild template generation failed:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to generate a website right now. Please retry.' }, { status: 502 });
  }
}
