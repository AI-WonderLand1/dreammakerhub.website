import { runModel } from "../../../core/ai/runModel";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { logUsage } from "@/lib/usage/log";
import { CostGateError, costGateResponse, reserveAiRequest } from "@/lib/billing/cost-guard.server";

export const runtime = "nodejs";

function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.message !== 'string' || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (body.message.length > 12000) {
    return NextResponse.json({ error: "Message exceeds the per-request budget" }, { status: 413 });
  }
  const sanitizedMessage = sanitizeInput(body.message);

  try {
    await reserveAiRequest(userId, sanitizedMessage.length, 1024);
    const result = await runModel({
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: sanitizedMessage }],
      temperature: 0.35,
      maxTokens: 1024,
    });
    if (result.error || !result.text) {
      return NextResponse.json({ error: result.error || "AI returned an empty response" }, { status: 502 });
    }
    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: result.tokens || Math.ceil(((sanitizedMessage.length + result.text.length) / 4)),
    });
    return NextResponse.json({ text: result.text });
  } catch (err: unknown) {
    if (err instanceof CostGateError) return costGateResponse(err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
