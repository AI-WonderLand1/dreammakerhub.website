import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getGeminiApiKey, extractJsonArray } from '../shared';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Batch template generation via Gemini.
 * Mirrors the Express /api/generate-batch endpoint from the template-library app.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireUser(req);
  if (authResult) return authResult;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { category, batchPrompt } = body;
  if (!category || !batchPrompt) {
    return NextResponse.json(
      { error: 'Missing required category or batchPrompt parameter.' },
      { status: 400 }
    );
  }

  const model = process.env.TEMPLATE_LIBRARY_BATCH_MODEL || 'gemini-2.5-flash';

  const systemInstruction = `You are WonderBuild AI, an expert website template generator.
Output ONLY a valid JSON array matching the exact schema specified in the prompt.
No preamble, no markdown code block fences, no conversational text.
Ensure every template has 4-6 sections (hero, features/content, testimonials or social proof, pricing/CTA, footer).
Use camelCase CSS-in-JS style property names exclusively.
Ensure thumbnail URLs use unique random seed words.`;

  try {
    const apiKey = getGeminiApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: batchPrompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`Gemini batch generation error ${response.status}: ${text.slice(0, 500)}`);
      return NextResponse.json(
        { error: `Gemini API error ${response.status}: ${text.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text ?? '')
        .join('') ?? '';

    const templates = extractJsonArray(rawText);

    return NextResponse.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (err: any) {
    logger.error('Batch generation failed:', err.message);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate templates with Gemini API.' },
      { status: 500 }
    );
  }
}
