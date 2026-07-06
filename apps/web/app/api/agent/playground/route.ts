import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";

const requestSchema = z.object({
  question: z.string().min(1).max(5000),
  persona: z.enum(["spirit_guide", "orchestrator", "rick", "default"]).default("default"),
  user_id: z.string().default("user"),
});

const AGENT_API_URL = process.env.AGENT_API_URL || "http://localhost:8000";
const ALICE_API_KEY = process.env.ALICE_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await requestSchema.safeParseAsync(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { ok: false, error: body.error.message },
        { status: 400 }
      );
    }

    const { question, persona, user_id } = body.data;

    if (persona === "rick" || persona === "default") {
      const response = await fetch(`${AGENT_API_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": ALICE_API_KEY,
        },
        body: JSON.stringify({ question, context: persona, user_id }),
      });

      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json({ ok: true, answer: data.answer, persona });
    }

    const endpoint = persona === "spirit_guide"
      ? "/api/spirit-guide/consult"
      : "/api/orchestrator/execute";

    const response = await fetch(`${AGENT_API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ALICE_API_KEY,
      },
      body: JSON.stringify({
        question: persona === "spirit_guide" ? question : undefined,
        goal: persona === "orchestrator" ? question : undefined,
        user_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      persona,
      answer: data.answer || data.summary,
      traceId: crypto.randomUUID(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Agent is offline. Start with: cd agent && ./run.sh" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    personas: ["spirit_guide", "orchestrator", "rick", "default"],
    status: "available",
  });
}
