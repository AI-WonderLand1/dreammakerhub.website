import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { resolveModel } from "@/lib/ai/models";
import { runModel } from "../../../core/ai/runModel";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";
import { createClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

const ChatSchema = z.object({
  modelId: z.string().max(120).optional(),
  message: z.string().min(1).max(10_000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(10_000),
  })).max(20).optional(),
  context: z.object({ page: z.string().max(300).optional() }).optional(),
});

const PAID_PLANS = new Set(["pro", "team", "enterprise"]);

async function getUserPlan(userId: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      logger.warn("Could not read profile subscription tier", { userId, error: error.message });
      return "free";
    }
    return data?.subscription_tier || "free";
  } catch (error) {
    logger.warn("Could not resolve user plan", { userId, error });
    return "free";
  }
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to use the AI assistant.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  let body: z.infer<typeof ChatSchema>;
  try {
    body = ChatSchema.parse(await req.json());
  } catch (e: unknown) {
    const issues = e instanceof z.ZodError ? e.issues : "Invalid JSON";
    return NextResponse.json({ error: "Invalid request", issues }, { status: 400 });
  }

  const resolved = resolveModel(body.modelId);
  if (resolved.tier === "premium") {
    const plan = await getUserPlan(userId);
    if (!PAID_PLANS.has(plan)) {
      return NextResponse.json(
        { error: "This model requires a paid plan", code: "UPGRADE_REQUIRED", upgrade: true, label: resolved.name },
        { status: 402 }
      );
    }
  }

  // Page context is untrusted user input. Supply only a pathname, never page
  // contents, secrets, cookies, query strings, or claims of having read files.
  const rawPage = body.context?.page;
  const page = rawPage?.startsWith("/") && !rawPage.startsWith("//")
    ? rawPage.split(/[?#]/, 1)[0].replace(/[\r\n]/g, " ").slice(0, 200)
    : null;
  const messages = [
    ...(resolved.systemPrompt ? [{ role: "system", content: resolved.systemPrompt }] : []),
    ...(page ? [{ role: "system", content: `The user reports that their current route is ${JSON.stringify(page)}. This is only a route hint, not proof of the page contents or project state.` }] : []),
    ...(body.history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: body.message },
  ];

  try {
    let text = "";
    let tokens = 0;
    if (resolved.tier === "free") {
      // The free runner supports OpenRouter, Groq, Gemini/Google AI, and Cerebras.
      // Missing credentials cannot be repaired by a frontend fallback.
      if (![process.env.OPENROUTER_API_KEY, process.env.GROQ_API_KEY,
        process.env.GEMINI_API_KEY, process.env.GOOGLE_AI_API_KEY,
        process.env.CEREBRAS_API_KEY].some((key) => key?.trim())) {
        logger.error("No platform AI provider key configured for /api/chat");
        return NextResponse.json(
          { error: "The assistant is temporarily unavailable because its AI provider is not configured. No message was processed.", code: "AI_NOT_CONFIGURED" },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
      const result = await runModel({ model: resolved.model, messages, temperature: 0.7 });
      if (result.error || !result.text.trim()) {
        logger.error("Sitewide assistant free-model completion failed");
        return NextResponse.json(
          { error: "The AI provider is temporarily unavailable. Your message was not completed.", code: "AI_PROVIDER_UNAVAILABLE" },
          { status: 502 }
        );
      }
      text = result.text;
      tokens = result.tokens;
    } else {
      // Premium models must not silently fall back to a different billed model.
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey?.trim()) {
        logger.error("OpenRouter missing for premium /api/chat model");
        return NextResponse.json(
          { error: "The selected AI model is not configured. No message was processed.", code: "AI_NOT_CONFIGURED" },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "https://dreammakerhub.website",
          "X-Title": "AI Wonderland",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: resolved.model, messages, stream: false, temperature: 0.7 }),
      });
      if (!res.ok) {
        logger.error(`Premium OpenRouter request failed (${res.status})`);
        return NextResponse.json({ error: "AI provider temporarily unavailable", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 502 });
      }
      const data = await res.json();
      text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
      if (typeof text !== "string" || !text.trim()) {
        return NextResponse.json({ error: "AI returned an empty response", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 502 });
      }
      tokens = data?.usage?.total_tokens ?? Math.ceil((body.message.length + text.length) / 4);
    }

    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: tokens,
      computeCreditsUsed: resolved.tier === "premium" ? 50 : 5,
    });
    return NextResponse.json({ ok: true, text, label: resolved.name, tier: resolved.tier });
  } catch (err: unknown) {
    logger.error("Sitewide assistant request failed", { kind: err instanceof Error ? err.name : "unknown" });
    return NextResponse.json({ error: "AI request failed", code: "AI_PROVIDER_UNAVAILABLE" }, { status: 502 });
  }
}
