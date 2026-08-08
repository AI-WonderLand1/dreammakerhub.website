import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getGeminiApiKey, extractJsonObject } from '../shared';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Complex UX/design audit via Gemini.
 * Mirrors the Express /api/complex-analysis endpoint.
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

  const { template } = body;
  if (!template) {
    return NextResponse.json({ error: 'Missing template data.' }, { status: 400 });
  }

  const model = process.env.TEMPLATE_LIBRARY_AUDIT_MODEL || 'gemini-2.5-pro';

  try {
    const apiKey = getGeminiApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Perform a comprehensive UX, visual design, conversion rate, and accessibility audit for this website template JSON:
${JSON.stringify(template, null, 2)}

Provide output strictly in JSON format with keys:
"score" (number 1-100),
"strengths" (array of strings),
"recommendations" (array of actionable strings),
"headlineImprovements" (array of objects { original: string, suggested: string, reason: string })`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`Gemini complex-analysis error ${response.status}: ${text.slice(0, 500)}`);
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

    const analysis = extractJsonObject(rawText);
    return NextResponse.json({ success: true, analysis });
  } catch (err: any) {
    logger.error('Complex analysis failed:', err.message);
    return NextResponse.json(
      { error: err?.message || 'Complex analysis failed.' },
      { status: 500 }
    );
  }
}
