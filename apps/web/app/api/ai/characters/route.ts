import { NextRequest, NextResponse } from "next/server";
import { opencodeProvider } from "@core/ai/providers/opencode";

export const runtime = "nodejs";
export const maxDuration = 30;

interface GenerateRequest {
  prompt: string;
  style?: "realistic" | "cartoon" | "anime" | "lowpoly";
  action?: "describe" | "suggest" | "enhance";
}

const CHARACTER_SYSTEM_PROMPT = `You are a 3D character design assistant. 
You help users design, describe, and enhance 3D character models for games and virtual worlds.
You can suggest:
- Character appearance (body type, features, clothing)
- Color schemes and materials
- Animation style and rigging requirements
- Optimized polygon counts for different platforms

Always keep responses concise and actionable for 3D artists.`;

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { prompt, style, action = "describe" } = body;

  if (!prompt?.trim()) {
    return NextResponse.json(
      { error: "Missing prompt" },
      { status: 400 }
    );
  }

  const stylePrefix = style ? `\nStyle: ${style}` : "";
  const actionPrefix = {
    describe: "Describe this character concept in detail suitable for a 3D artist:",
    suggest: "Suggest 3 variations of this character concept:",
    enhance: "Enhance this character description with more detail:",
  }[action];

  try {
    const response = await opencodeProvider.generate(
      `${actionPrefix} ${prompt}${stylePrefix}`,
      {
        system: CHARACTER_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    return NextResponse.json({
      success: true,
      result: response.text,
      action,
      style,
    });
  } catch (error) {
    console.error("Character AI error:", error);
    return NextResponse.json(
      { error: "Failed to generate character" },
      { status: 500 }
    );
  }
}