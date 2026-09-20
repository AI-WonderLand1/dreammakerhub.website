import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { CostGateError, costGateResponse, reserveAiRequest } from '@/lib/billing/cost-guard.server';

const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
const MAX_INPUT_CHARACTERS = 12000;
const MAX_OUTPUT_TOKENS = 1024;

/** Authenticated proxy: never accept an arbitrary user-selected billable model. */
export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI provider is not configured' }, { status: 503 });

  const body = await req.json().catch(() => null);
  const model = body?.model;
  const allowedModels = (process.env.OPENROUTER_ALLOWED_MODELS || DEFAULT_MODEL)
    .split(',').map((value) => value.trim()).filter(Boolean);
  if (typeof model !== 'string' || !allowedModels.includes(model)) {
    return NextResponse.json({ error: 'This model is not enabled for your plan.' }, { status: 403 });
  }
  if (!Array.isArray(body?.messages) || body.messages.length < 1 || body.messages.length > 20 ||
      body.messages.some((message: unknown) => !message || typeof message !== 'object' ||
        !['user', 'assistant', 'system'].includes((message as { role?: string }).role || '') ||
        typeof (message as { content?: unknown }).content !== 'string')) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
  }
  const inputCharacters = body.messages.reduce((total: number, message: { content: string }) => total + message.content.length, 0);
  if (inputCharacters < 1 || inputCharacters > MAX_INPUT_CHARACTERS) {
    return NextResponse.json({ error: 'Input exceeds the per-request budget' }, { status: 413 });
  }
  try {
    await reserveAiRequest(userId, inputCharacters, MAX_OUTPUT_TOKENS);
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'https://dreammakerhub.website',
        'X-Title': 'DreamMakerHub',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: body.stream === true,
      }),
    });
    if (!response.ok) return NextResponse.json({ error: 'AI provider request failed' }, { status: 502 });
    if (body.stream === true && response.body) {
      return new NextResponse(response.body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' },
      });
    }
    return NextResponse.json(await response.json());
  } catch (error: unknown) {
    if (error instanceof CostGateError) return costGateResponse(error);
    return NextResponse.json({ error: 'AI provider unavailable' }, { status: 502 });
  }
}
