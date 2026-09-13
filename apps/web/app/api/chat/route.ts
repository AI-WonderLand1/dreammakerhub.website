import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { resolveModel } from "@/lib/ai/models";
import { logUsage } from "@/lib/usage/log";
import { logger } from "@/lib/logger";
import { createClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

const ChatSchema = z.object({
  modelId: z.string().max(120).optional(),
  message: z.string().min(1).max(10_000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(10_000),
      })
    )
    .max(20)
    .optional(),
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    logger.error("OPENROUTER_API_KEY missing for /api/chat");
    return NextResponse.json({ error: "AI is not configured" }, { status: 500 });
  }

  let body: z.infer<typeof ChatSchema>;
  try {
    body = ChatSchema.parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: "Invalid request", issues: e?.issues ?? String(e) },
      { status: 400 }
    );
  }

  const resolved = resolveModel(body.modelId);

  if (resolved.tier === "premium") {
    const plan = await getUserPlan(userId);
    if (!PAID_PLANS.has(plan)) {
      return NextResponse.json(
        {
          error: "This model requires a paid plan",
          upgrade: true,
          label: resolved.name,
        },
        { status: 402 }
      );
    }
  }

  const messages = [
    ...(resolved.systemPrompt
      ? [{ role: "system", content: resolved.systemPrompt }]
      : []),
    ...(body.history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: body.message },
  ];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "https://dreammakerhub.website",
        "X-Title": "AI Wonderland",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolved.model,
        messages,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      logger.error(`OpenRouter ${res.status} on ${resolved.model}:`, details.slice(0, 300));
      return NextResponse.json(
        { error: `AI provider error (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";

    if (!text.trim()) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    const tokens =
      data?.usage?.total_tokens ??
      Math.ceil((body.message.length + text.length) / 4);

    await logUsage({
      userId,
      action: "ai.token",
      apiCalls: 1,
      tokensUsed: tokens,
      computeCreditsUsed: resolved.tier === "premium" ? 50 : 5,
    });

    return NextResponse.json({
      ok: true,
      text,
      label: resolved.name,
      tier: resolved.tier,
    });
  } catch (err: any) {
    logger.error("Chat completion failed:", err?.message);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
