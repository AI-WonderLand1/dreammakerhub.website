import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getGeminiApiKey } from '../shared';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Google Search grounding via Gemini.
 * Mirrors the Express /api/search-grounding endpoint.
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

  const { query } = body;
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter.' }, { status: 400 });
  }

  const model = process.env.TEMPLATE_LIBRARY_GROUNDING_MODEL || 'gemini-2.5-flash';

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
                text: `Perform grounded search research for web design, template trends, and content related to: ${query}. Summarize key features, design best practices, layout structure, color schemes, and target audience expectations.`,
              },
            ],
          },
        ],
        tools: [{ googleSearch: {} }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`Gemini search-grounding error ${response.status}: ${text.slice(0, 500)}`);
      return NextResponse.json(
        { error: `Gemini API error ${response.status}: ${text.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text ?? '')
        .join('') ?? '';

    const rawChunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || chunk.web.uri,
        uri: chunk.web.uri,
      }));

    return NextResponse.json({ success: true, text, sources });
  } catch (err: any) {
    logger.error('Search grounding failed:', err.message);
    return NextResponse.json(
      { error: err?.message || 'Search grounding failed.' },
      { status: 500 }
    );
  }
}
