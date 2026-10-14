import { runModel } from "../../../core/ai/runModel";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { logUsage } from "@/lib/usage/log";
import { CostGateError, costGateResponse, reserveAiRequest } from "@/lib/billing/cost-guard.server";

import { runFreeBuilder } from "@/lib/builder/free-generation.server";

export const runtime = "nodejs";

// Keep prompts intact: stripping < and > corrupts legitimate JSX, HTML and
// TypeScript requests. Prompt text is never interpreted as HTML in this API.
const hasProvider = () => [
  process.env.OPENROUTER_API_KEY,
  process.env.GROQ_API_KEY,
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_AI_API_KEY,
  process.env.CEREBRAS_API_KEY,
].some((key) => Boolean(key?.trim()));

const noStore = { "Cache-Control": "no-store" };

const BUILDER_OUTPUT_BUDGET = 2048;

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to use the AI builder.", code: "AUTH_REQUIRED" },
      { status: 401, headers: noStore },
    );
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required", code: "BAD_REQUEST" }, { status: 400, headers: noStore });
  }
  const message = body.message.trim();
  if (message.length > 12000) {
    return NextResponse.json({ error: "Message exceeds the per-request budget", code: "COST_GUARD" }, { status: 413, headers: noStore });
  }

  // Explicit, quota-limited free beta remains off by default. This enables a
  // genuinely live builder before the paid cross-repo billing migration, without
  // allowing paid models or unmetered calls.
  if (process.env.FREE_BUILDER_AI_ENABLED === "true" &&
      process.env.BILLABLE_OPERATIONS_ENABLED !== "true") {
    try {
      return await runFreeBuilder(userId, message);
    } catch {
      return NextResponse.json(
        { error: "Free AI builder is unavailable. No changes were applied.", code: "AI_PROVIDER_UNAVAILABLE" },
        { status: 502, headers: noStore },
      );
    }
  }

  // Don't reserve scarce AI allowance when a provider isn't configured.
  // A present key does not guarantee that provider requests will succeed.
  if (!hasProvider()) {
    return NextResponse.json(
      { error: "The AI builder is not configured. No request was sent.", code: "AI_NOT_CONFIGURED" },
      { status: 503, headers: noStore },
    );
  }

  try {
    // The paid path retains its existing v2 reservation before model calls.
    await reserveAiRequest(userId, message.length, BUILDER_OUTPUT_BUDGET);
    // Metered calls must not silently retry other billable providers under the
    // same reservation. The shared model adapter chooses one configured route.
    const result = await runModel({
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: message }],
      temperature: 0.35,
      maxTokens: BUILDER_OUTPUT_BUDGET,
      singleProviderAttempt: true,
    });
    if (result.error || !result.text?.trim()) {
      // Provider error strings can contain credentials or private payloads.
      return NextResponse.json(
        { error: "The AI builder provider is temporarily unavailable. No changes were applied.", code: "AI_PROVIDER_UNAVAILABLE" },
        { status: 502, headers: noStore },
      );
    }
    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: result.tokens || Math.ceil((message.length + result.text.length) / 4),
    });
    return NextResponse.json({ text: result.text }, { headers: noStore });
  } catch (err: unknown) {
    if (err instanceof CostGateError) return costGateResponse(err);
    return NextResponse.json(
      { error: "The AI builder request failed. No confirmed response was received.", code: "AI_PROVIDER_UNAVAILABLE" },
      { status: 502, headers: noStore },
    );
  }
}
