import { NextRequest, NextResponse } from 'next/server';
import { requireUser, extractJsonArray } from '../shared';
import { runModel } from '../../../../../core/ai/runModel';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const systemInstruction = `You are WonderBuild AI, an expert website template generator.
Output ONLY a valid JSON array matching the exact schema specified in the prompt.
No preamble, no markdown code block fences, no conversational text.
Ensure every template has 4-6 sections (hero, features/content, testimonials or social proof, pricing/CTA, footer).
Use camelCase CSS-in-JS style property names exclusively.
Ensure thumbnail URLs use unique random seed words.`;

function hasPlatformProvider(): boolean {
  return [
    process.env.OPENROUTER_API_KEY,
    process.env.GROQ_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_AI_API_KEY,
    process.env.CEREBRAS_API_KEY,
  ].some((key) => Boolean(key?.trim()));
}

/** Generate a real template using the existing server-side provider fallback chain. */
export async function POST(req: NextRequest) {
  const authResult = await requireUser(req);
  if (authResult) return authResult;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const category = body && typeof body === 'object' && 'category' in body ? body.category : undefined;
  const batchPrompt = body && typeof body === 'object' && 'batchPrompt' in body ? body.batchPrompt : undefined;
  if (typeof category !== 'string' || !category.trim() || typeof batchPrompt !== 'string' || !batchPrompt.trim()) {
    return NextResponse.json({ error: 'Missing required category or batchPrompt parameter.' }, { status: 400 });
  }
  if (batchPrompt.length > 16000) {
    return NextResponse.json({ error: 'Template request is too long.' }, { status: 400 });
  }
  if (!hasPlatformProvider()) {
    return NextResponse.json({ error: 'Website generation is unavailable: no server AI provider is configured.' }, { status: 503 });
  }

  try {
    // This is the app's real OpenRouter -> Groq -> Gemini -> Cerebras chain.
    // Never send platform API keys to the browser or expose upstream error bodies.
    const result = await runModel({
      messages: [{ role: 'user', content: batchPrompt }],
      system: systemInstruction,
      temperature: 0.6,
      maxTokens: 8192,
    });

    if (result.error || !result.text.trim()) {
      logger.error('WonderBuild AI template generation failed (configured providers unavailable).');
      return NextResponse.json(
        { error: 'The AI providers could not generate a website. Check provider access or usage limits and retry.' },
        { status: 502 },
      );
    }

    let templates: unknown[];
    try {
      templates = extractJsonArray(result.text);
    } catch {
      logger.warn('WonderBuild AI provider returned invalid template JSON.');
      return NextResponse.json({ error: 'AI returned an invalid template. Please retry.' }, { status: 502 });
    }

    if (!templates.length || templates.some((template) =>
      !template || typeof template !== 'object' ||
      !('elements' in template) || !Array.isArray(template.elements) || template.elements.length === 0
    )) {
      return NextResponse.json({ error: 'AI returned an empty or invalid website template. Please retry.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, count: templates.length, templates });
  } catch (err: unknown) {
    logger.error('WonderBuild template generation failed:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to generate a website right now. Please retry.' }, { status: 502 });
  }
}
