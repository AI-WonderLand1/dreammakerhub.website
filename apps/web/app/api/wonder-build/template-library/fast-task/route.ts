import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getGeminiApiKey } from '../shared';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fast micro-task via Gemini.
 * Mirrors the Express /api/fast-task endpoint.
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

  const { prompt, context } = body;
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt.' }, { status: 400 });
  }

  const model = process.env.TEMPLATE_LIBRARY_FAST_MODEL || 'gemini-2.5-flash-8b';

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
                text: `Context: ${context || 'Web template micro-copy'}\nRequest: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.8 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`Gemini fast-task error ${response.status}: ${text.slice(0, 500)}`);
      return NextResponse.json(
        { error: `Gemini API error ${response.status}: ${text.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const result =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text ?? '')
        .join('') ?? '';

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    logger.error('Fast task failed:', err.message);
    return NextResponse.json(
      { error: err?.message || 'Fast task execution failed.' },
      { status: 500 }
    );
  }
}
