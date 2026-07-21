/**
 * POST /api/wonder-build/ai/suggestions
 * Analyzes user prompt and suggests blocks using LLM
 * Returns suggestions with explanations
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

interface SuggestionRequest {
  prompt: string;
  currentBlocks: string[];
  availableBlocks: string[];
}

interface BlockSuggestion {
  blockId: string;
  reason: string;
  confidence: number;
  explanation: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that suggests visual builder blocks based on user descriptions.

Given the user's prompt, their current blocks, and the available blocks, suggest the best blocks to add.

You MUST respond in this exact JSON format:
{
  "suggestions": [
    {"blockId": "block-name", "reason": "short reason", "confidence": 0.9, "explanation": "longer explanation"}
  ]
}

Available blocks: button, form, card, grid, hero, heading, image, text, input, container, row, testimonial, aiBlock

Rules:
- Suggest up to 5 blocks
- confidence is a number between 0 and 1
- Don't suggest blocks the user already has
- Keep reasons short (1 sentence)
- Explanations should be helpful and actionable`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentBlocks, availableBlocks } =
      (await req.json()) as SuggestionRequest;

    if (!prompt || !availableBlocks) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const suggestions = await generateSuggestions(
      prompt,
      currentBlocks,
      availableBlocks
    );

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (err) {
    logger.error("Error in AI suggestions:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function callCerebras(prompt: string): Promise<string> {
  if (!CEREBRAS_API_KEY) throw new Error("Cerebras API key not configured");

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
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

async function generateSuggestions(
  prompt: string,
  currentBlocks: string[],
  availableBlocks: string[]
): Promise<BlockSuggestion[]> {
  const userPrompt = `User wants to build: "${prompt}"\nCurrent blocks: ${currentBlocks.join(", ") || "none"}\nAvailable blocks: ${availableBlocks.join(", ")}\n\nSuggest the best blocks to add.`;

  let text = "";

  if (CEREBRAS_API_KEY) {
    try {
      text = await callCerebras(userPrompt);
    } catch (err: any) {
      logger.error("Cerebras failed for suggestions:", err.message);
    }
  }

  if (!text && HF_TOKEN) {
    try {
      text = await callHuggingFace(userPrompt);
    } catch (err: any) {
      logger.error("HuggingFace failed for suggestions:", err.message);
    }
  }

  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.suggestions)) {
        return parsed.suggestions.filter(
          (s: BlockSuggestion) => !currentBlocks.includes(s.blockId)
        );
      }
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.suggestions)) {
            return parsed.suggestions.filter(
              (s: BlockSuggestion) => !currentBlocks.includes(s.blockId)
            );
          }
        } catch {}
      }
    }
  }

  return [];
}
