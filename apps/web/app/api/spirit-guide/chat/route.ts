import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALICE_API_URL = process.env.AGENT_API_URL || "http://localhost:8000";
const ALICE_API_KEY = process.env.ALICE_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let question = message;
    if (history?.length > 0) {
      const context = history.slice(-6).map((m: any) => `${m.role}: ${m.content}`).join("\n");
      question = `Previous conversation:\n${context}\n\nUser: ${message}`;
    }

    const aliceRes = await fetch(`${ALICE_API_URL}/api/spirit-guide/consult`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ALICE_API_KEY,
      },
      body: JSON.stringify({ question, user_id: "web-user" }),
    });

    if (!aliceRes.ok) {
      const errText = await aliceRes.text();
      return NextResponse.json(
        { error: `Alice API error: ${aliceRes.status}` },
        { status: 502 }
      );
    }

    const data = await aliceRes.json();

    const createKeywords = ["create", "make", "build", "generate", "design", "3d", "scene", "game", "world"];
    const isCreateRequest = createKeywords.some(kw => message.toLowerCase().includes(kw));

    return NextResponse.json({
      response: data.answer || "I have no wisdom to share at this moment.",
      action: isCreateRequest ? "create_scene" : "answer"
    });

  } catch (error: any) {
    console.error("Spirit Guide error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reach Alice. Is the agent server running?" },
      { status: 503 }
    );
  }
}
