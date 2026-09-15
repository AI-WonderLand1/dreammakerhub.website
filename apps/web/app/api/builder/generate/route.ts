import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runModel } from "@/core/ai/runModel";
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { logger } from '@/lib/logger';

const MAX_BODY_BYTES = 32 * 1024;

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(12_000),
  mode: z.string().trim().max(80).optional().default('website'),
  platform: z.string().trim().max(80).optional().default('web'),
  image: z.string().trim().url().max(2_048).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  const declaredLength = Number(req.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    const parsedJson = JSON.parse(raw) as unknown;
    const parsed = requestSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid generation request' }, { status: 400 });
    }

    const { prompt, mode, platform, image } = parsed.data;
    const systemPrompt = `
      You are the Wonder-Build AI Engine.
      Platform Target: ${platform}
      Mode: ${mode}

      Output ONLY valid JSON matching this schema:
      {
        "type": "string",
        "className": "string",
        "style": {},
        "content": "string",
        "children": []
      }
      Use Tailwind CSS for styling. Do not explain the code.
    `;

    const result = await runModel({
      model: "openrouter/meta-llama/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: `${prompt}${image ? `\n\nImage reference: ${image}` : ''}` }],
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    });

    if (result.error) throw new Error('AI generation failed');

    let aiContent: unknown;
    try {
      aiContent = JSON.parse(result.text);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid layout data' }, { status: 502 });
    }

    return NextResponse.json(aiContent, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    logger.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to generate layout" }, { status: 500 });
  }
}
