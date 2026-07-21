/**
 * POST /api/wonder-build/ai/chat
 * Handles multi-turn AI chat for the builder
 * Returns response text and suggested blocks
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  currentBlocks: string[];
  history: ChatMessage[];
}

interface ChatResponse {
  response: string;
  suggestions: Array<{ blockId: string; reason: string }>;
}

const SYSTEM_PROMPT = `You are an AI assistant helping users build web pages using a visual builder.
Your role is to:
1. Understand what the user wants to build
2. Suggest appropriate blocks/components (Button, Card, Form, Grid, Hero, Image, Text, Heading, Container, AI Block, etc.)
3. Explain why each suggestion is good for their use case
4. Keep responses concise and friendly
5. Ask clarifying questions if needed

When suggesting blocks, format them as: [SUGGEST: blockId | reason]
Example: [SUGGEST: hero | Eye-catching header section]

Available blocks: button, form, card, grid, hero, heading, image, text, input, container, row, testimonial, aiBlock

You MUST respond in this exact JSON format:
{
  "response": "your conversational response",
  "suggestions": [{"blockId": "block-name", "reason": "why it fits"}]
}

Always be encouraging and creative!`;

export async function POST(req: NextRequest) {
  try {
    const { message, currentBlocks, history } = (await req.json()) as ChatRequest;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const { response, suggestions } = await generateAIResponse(
      message,
      currentBlocks,
      history
    );

    return NextResponse.json(
      { response, suggestions } as ChatResponse,
      { status: 200 }
    );
  } catch (err) {
    logger.error("Error in AI chat:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseAISuggestions(text: string): Array<{ blockId: string; reason: string }> {
  const suggestions: Array<{ blockId: string; reason: string }> = [];
  const regex = /\[SUGGEST:\s*(\w+)\s*\|\s*([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    suggestions.push({ blockId: match[1], reason: match[2].trim() });
  }
  return suggestions;
}

async function callCerebras(prompt: string, history: ChatMessage[]): Promise<string> {
  if (!CEREBRAS_API_KEY) throw new Error("Cerebras API key not configured");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt },
  ];

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callHuggingFace(prompt: string): Promise<string> {
  if (!HF_TOKEN) throw new Error("HuggingFace token not configured");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/microsoft/Phi-4-mini-instruct",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: `${SYSTEM_PROMPT}\n\nUser: ${prompt}`,
        parameters: { max_new_tokens: 2048, return_full_text: false },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || "";
}

async function generateAIResponse(
  userMessage: string,
  _currentBlocks: string[],
  history: ChatMessage[]
): Promise<ChatResponse> {
  let text = "";

  if (CEREBRAS_API_KEY) {
    try {
      text = await callCerebras(userMessage, history);
    } catch (err: any) {
      logger.error("Cerebras failed, falling back:", err.message);
    }
  }

  if (!text && HF_TOKEN) {
    try {
      text = await callHuggingFace(userMessage);
    } catch (err: any) {
      logger.error("HuggingFace also failed:", err.message);
    }
  }

  if (text) {
    try {
      const parsed = JSON.parse(text);
      return {
        response: parsed.response || text,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : parseAISuggestions(text),
      };
    } catch {
      const suggestions = parseAISuggestions(text);
      return {
        response: text.replace(/\[SUGGEST:[^\]]+\]/g, "").trim(),
        suggestions,
      };
    }
  }

  return {
    response: "No AI provider is configured. Set CEREBRAS_API_KEY or HUGGINGFACE_TOKEN in your environment.",
    suggestions: [],
  };
}
