import { NextRequest, NextResponse } from 'next/server';
import { opencodeProvider } from '@core/ai/providers/opencode';
import { openrouterProvider } from '@core/ai/providers/openrouter';

interface NpcRequest {
  sessionId: string;
  utterance: string;
  characterId?: string;
  provider?: 'opencode' | 'openrouter';
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const conversationHistory = new Map<string, ConversationMessage[]>();

const NPC_SYSTEM_PROMPT = `You are an interactive NPC character in a 3D virtual world. 
Respond to the user's messages in a natural, characterful way.
Keep responses concise and conversational (1-3 sentences typically).
Stay in character as the assigned character.
If the user asks about your capabilities, explain that you can have conversations, remember context, and help with various tasks in the virtual world.`;

export async function POST(req: NextRequest) {
  let body: NpcRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  if (!body.utterance?.trim()) {
    return NextResponse.json(
      { error: 'Missing required field: utterance' },
      { status: 400 }
    );
  }

  const sessionId = body.sessionId || `default-${Date.now()}`;
  const providerType = body.provider || 'opencode';
  
  let history = conversationHistory.get(sessionId) || [];
  
  history.push({
    role: 'user',
    content: body.utterance,
    timestamp: Date.now()
  });

  const characterContext = body.characterId 
    ? `\nCharacter ID: ${body.characterId}` 
    : '';

  const prompt = `Previous conversation:\n${
    history.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')
  }\n\nCurrent user message: ${body.utterance}${characterContext}`;

  try {
    const provider = providerType === 'openrouter' ? openrouterProvider : opencodeProvider;
    
    const response = await provider.generate(prompt, {
      model: providerType === 'openrouter' ? 'gemini-2.5-flash' : 'opencode/big-pickle',
      system: NPC_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 500
    });

    const npcText = response.text || "I'm having trouble responding right now.";

    history.push({
      role: 'assistant',
      content: npcText,
      timestamp: Date.now()
    });

    if (history.length > 20) {
      history = history.slice(-20);
    }
    conversationHistory.set(sessionId, history);

    return NextResponse.json({
      text: npcText,
      timestamp: Date.now(),
      provider: providerType
    });
    
  } catch (error) {
    console.error('Error calling AI provider:', error);
    return NextResponse.json(
      { error: 'Failed to generate NPC response', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  
  if (sessionId) {
    conversationHistory.delete(sessionId);
  }
  
  return NextResponse.json({ success: true });
}