import { runModel } from "../../../core/ai/runModel"
import { NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth"
import { logUsage } from "@/lib/usage/log"

export const runtime = "nodejs";

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').slice(0, 30000);
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json()

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const sanitizedMessage = sanitizeInput(message);

  try {
    const result = await runModel({
      model: "openrouter/openrouter/auto",
      messages: [{ role: "user", content: sanitizedMessage }],
      temperature: 0.35,
      maxTokens: 5000,
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
      tokensUsed: result.tokens || Math.ceil(((sanitizedMessage.length + result.text.length) / 4)),
    })

    return NextResponse.json({ text: result.text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
