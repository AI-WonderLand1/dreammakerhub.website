import { NextRequest, NextResponse } from "next/server";
import { runModel } from "@core/ai/runModel";

export const runtime = "nodejs";

const SPIRIT_GUIDE_SYSTEM = `You are the Spirit Guide of AI Wonderland — a wise, creative, and inspiring AI companion.
You help users build websites, 3D scenes, games, and creative projects using AI.
Be encouraging, concise, and visionary. Keep responses under 150 words unless the user asks you to build something.
When the user wants to create something, describe what you'd build and suggest next steps.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (history?.length > 0) {
      for (const m of history.slice(-8)) {
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: "user", content: message });

    const result = await runModel({
      model: "groq/llama-3.3-70b-versatile",
      messages,
      system: SPIRIT_GUIDE_SYSTEM,
      temperature: 0.8,
      maxTokens: 512,
    });

    const response = result.text || "I sense great creativity in you. What would you like to build?";
    const createKeywords = ["create", "make", "build", "generate", "design", "3d", "scene", "game", "world"];
    const isCreateRequest = createKeywords.some(kw => message.toLowerCase().includes(kw));

    return NextResponse.json({ response, action: isCreateRequest ? "create_scene" : "answer" });

  } catch (error: any) {
    console.error("Spirit Guide error:", error);
    return NextResponse.json(
      { error: error.message || "Spirit Guide is resting. Try again shortly." },
      { status: 500 }
    );
  }
}
