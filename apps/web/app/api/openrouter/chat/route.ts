import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';

interface OpenRouterRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
}

/**
 * Server-side proxy for OpenRouter API calls.
 * This keeps the API key secure on the server instead of exposing it to the client.
 */
export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    logger.error('OPENROUTER_API_KEY is not configured');
    return NextResponse.json(
      { error: 'OpenRouter API key is not configured' },
      { status: 500 }
    );
  }

  let body: OpenRouterRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.model || !body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: 'Missing required fields: model and messages' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        'X-Title': 'Wonder.Lab Sovereign_OS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        top_p: body.top_p ?? 1,
        top_k: body.top_k ?? 40,
        stream: body.stream ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'OpenRouter API error', details: errorText },
        { status: response.status }
      );
    }

    // For streaming responses, forward the stream
    if (body.stream && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For non-streaming, forward the JSON response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    logger.error('Error calling OpenRouter:', error);
    return NextResponse.json(
      { error: 'Failed to call OpenRouter API' },
      { status: 500 }
    );
  }
}