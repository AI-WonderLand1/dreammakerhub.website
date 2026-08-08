import { NextRequest, NextResponse } from 'next/server';
import { requireUser, getGeminiApiKey } from '../shared';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Image generation / editing via Gemini.
 * Mirrors the Express /api/generate-image endpoint.
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

  const { prompt, baseImage, aspectRatio = '16:9', imageSize = '1K' } = body;
  if (!prompt) {
    return NextResponse.json({ error: 'Missing image prompt.' }, { status: 400 });
  }

  // gemini-2.0-flash-exp supports native image output via responseModalities.
  const model = process.env.TEMPLATE_LIBRARY_IMAGE_MODEL || 'gemini-2.0-flash-exp';

  try {
    const apiKey = getGeminiApiKey();
    const parts: any[] = [];
    if (baseImage) {
      const match = String(baseImage).match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }
    parts.push({ text: prompt });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          aspectRatio,
          imageSize,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(`Gemini image error ${response.status}: ${text.slice(0, 500)}`);
      return NextResponse.json(
        { error: `Gemini API error ${response.status}: ${text.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const candidateParts = data?.candidates?.[0]?.content?.parts || [];

    let generatedImageUrl: string | null = null;
    let caption = '';
    for (const part of candidateParts) {
      if (part.inlineData) {
        const mime = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        caption += part.text;
      }
    }

    if (!generatedImageUrl) {
      throw new Error('No image data returned from Gemini image model.');
    }

    return NextResponse.json({ success: true, imageUrl: generatedImageUrl, caption });
  } catch (err: any) {
    logger.error('Image generation failed:', err.message);
    return NextResponse.json(
      { error: err?.message || 'Image generation failed.' },
      { status: 500 }
    );
  }
}
