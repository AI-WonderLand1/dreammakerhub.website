import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SPIRIT_GUIDE_SYSTEM = `You are the Spirit Guide - a helpful AI assistant for the Wonderland 3D platform.

You help users with:
1. Answering questions about the platform, features, and how to use it
2. Creating 3D scenes when users describe what they want
3. Guiding users to the right tools

Available tools:
- Create with AI: /game-builder/create (describe a scene to AI)
- Scene Library: /library (browse pre-made scenes + blank canvas)
- WebGL Studio Editor: /wonder-build/playcanvas (edit scenes, import files)
- Cloud Storage Settings: /settings/cloud-storage (connect your own storage)

Guidelines:
- Be helpful and conversational
- When users want to create a 3D scene, guide them to /game-builder/create
- When users want to browse templates, guide them to /library  
- When users want to edit a scene or import files, guide them to /wonder-build/playcanvas
- When users want to connect their own storage, guide them to /settings/cloud-storage
- Keep responses concise but informative`;

async function callGithubAI(system: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GITHUB_MODELS_API_KEY;
  if (!apiKey) {
    return "I'm here to help! Please describe what you'd like to build or ask any questions about the Wonderland platform.";
  }

  try {
    const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
  } catch {
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const conversationHistory = history?.slice(-10).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    })) || [];

    const createKeywords = ["create", "make", "build", "generate", "design", "3d", "scene", "game", "world"];
    const isCreateRequest = createKeywords.some(kw => message.toLowerCase().includes(kw));

    const fullPrompt = conversationHistory.length > 0
      ? `Previous conversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join("\n")}\n\nUser: ${message}`
      : message;

    const response = await callGithubAI(SPIRIT_GUIDE_SYSTEM, fullPrompt);

    return NextResponse.json({
      response: response.trim(),
      action: isCreateRequest ? "create_scene" : "answer"
    });

  } catch (error: any) {
    console.error("Spirit Guide error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response" },
      { status: 500 }
    );
  }
}