import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { groqProvider } from '@/core/ai/providers/groq';
import { openrouterProvider } from '@/core/ai/providers/openrouter';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { logger } from '@/lib/logger';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const MAX_BODY_BYTES = 16 * 1024;
const MAX_SESSIONS = 2_000;
const SESSION_TTL_MS = 30 * 60 * 1000;
const conversationHistory = new Map<string, { messages: ConversationMessage[]; updatedAt: number }>();

const requestSchema = z.object({
  sessionId: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  utterance: z.string().trim().min(1).max(4_000),
  characterId: z.string().trim().max(128).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  provider: z.enum(['groq', 'openrouter']).optional().default('groq'),
});

const NPC_SYSTEM_PROMPT = `You are an interactive NPC character in a 3D virtual world.
Respond to the user's messages in a natural, characterful way.
Keep responses concise and conversational (1-3 sentences typically).
Stay in character as the assigned character.
If the user asks about your capabilities, explain that you can have conversations, remember context, and help with various tasks in the virtual world.`;

function cleanupSessions(now: number) {
  for (const [key, value] of conversationHistory) {
    if (value.updatedAt < now - SESSION_TTL_MS) conversationHistory.delete(key);
  }

  if (conversationHistory.size > MAX_SESSIONS) {
    const oldest = [...conversationHistory.entries()]
      .sort((a, b) => a[1].updatedAt - b[1].updatedAt)
      .slice(0, conversationHistory.size - MAX_SESSIONS);
    for (const [key] of oldest) conversationHistory.delete(key);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  const declaredLength = Number(req.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    const raw = await req.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    const result = requestSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid NPC request' }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const now = Date.now();
  cleanupSessions(now);

  const clientSessionId = parsed.sessionId || `default-${now}`;
  const sessionKey = `${auth.userId}:${clientSessionId}`;
  const providerType = parsed.provider;

  let history = conversationHistory.get(sessionKey)?.messages || [];
  history.push({ role: 'user', content: parsed.utterance, timestamp: now });

  const characterContext = parsed.characterId ? `\nCharacter ID: ${parsed.characterId}` : '';
  const prompt = `Previous conversation:\n${
    history.slice(-20, -1).map((message) => `${message.role}: ${message.content}`).join('\n')
  }\n\nCurrent user message: ${parsed.utterance}${characterContext}`;

  try {
    const provider = providerType === 'openrouter' ? openrouterProvider : groqProvider;
    const model = providerType === 'openrouter' ? 'google/gemini-flash-1.5' : 'llama-3.1-8b-instant';

    const response = await provider.generate(prompt, {
      model,
      system: NPC_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 500,
    });

    const npcText = response.text || "I'm having trouble responding right now.";
    history.push({ role: 'assistant', content: npcText, timestamp: Date.now() });
    history = history.slice(-20);
    conversationHistory.set(sessionKey, { messages: history, updatedAt: Date.now() });

    return NextResponse.json(
      { text: npcText, timestamp: Date.now(), provider: providerType, sessionId: clientSessionId },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    logger.error('Error calling AI provider:', error);
    return NextResponse.json({ error: 'Failed to generate NPC response' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId')?.trim();
  if (!sessionId || !/^[a-zA-Z0-9_-]{1,128}$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  conversationHistory.delete(`${auth.userId}:${sessionId}`);
  return NextResponse.json({ success: true }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
