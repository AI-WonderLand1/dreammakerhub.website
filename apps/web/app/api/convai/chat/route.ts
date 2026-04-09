import { NextRequest, NextResponse } from 'next/server';

interface ConvaiRequest {
  sessionId: string;
  utterance: string;
  characterId?: string;
}

/**
 * Server-side proxy for Convai NPC API calls.
 * This keeps the API key secure on the server instead of exposing it to the client.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.CONVAI_API_KEY;
  const defaultCharacterId = process.env.CONVAI_CHARACTER_ID;
  
  if (!apiKey) {
    console.error('CONVAI_API_KEY is not configured');
    return NextResponse.json(
      { error: 'Convai API key is not configured' },
      { status: 500 }
    );
  }

  let body: ConvaiRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.utterance?.trim()) {
    return NextResponse.json(
      { error: 'Missing required field: utterance' },
      { status: 400 }
    );
  }

  const characterId = body.characterId || defaultCharacterId;
  if (!characterId) {
    return NextResponse.json(
      { error: 'Missing characterId - either provide it in the request or set CONVAI_CHARACTER_ID' },
      { status: 400 }
    );
  }

  try {
    // Convai API endpoint (adjust based on actual Convai API documentation)
    const response = await fetch('https://api.convai.com/v1/character/response', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character_id: characterId,
        session_id: body.sessionId,
        text: body.utterance,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Convai API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Convai API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error calling Convai:', error);
    return NextResponse.json(
      { error: 'Failed to call Convai API' },
      { status: 500 }
    );
  }
}