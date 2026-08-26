import { runModel } from "@/core/ai/runModel"
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { logUsage } from "@/lib/usage/log"
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').slice(0, 10000);
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const sanitizedMessage = sanitizeInput(message);

  try {
    const result = await runModel({
      model: "openrouter/google/gemini-flash-1.5",
      messages: [{ role: "user", content: sanitizedMessage }]
    })

    if (result.error || !result.text) {
      return NextResponse.json(
        { error: result.error || "AI returned an empty response" },
        { status: 502 }
      );
    }

    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: Math.ceil(((sanitizedMessage.length + result.text.length) / 4)),
    })

    return NextResponse.json({ text: result.text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI error" }, { status: 500 })
  }
}
