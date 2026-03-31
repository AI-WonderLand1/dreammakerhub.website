import { NextRequest, NextResponse } from "next/server";
import { logger } from "@lib/logger";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";
import { requirePaidAIUser } from "@/app/api/ai/auth";

export const runtime = "nodejs";

async function runTask(task: string, payload: unknown) {
  switch (task) {
    case "echo":
      return { message: "Echo", payload };

    case "summarize": {
      const text =
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>).text
          : undefined;

      if (!text || typeof text !== "string") {
        throw new Error("Missing text to summarize");
      }

      const preview = text.length > 180 ? `${text.slice(0, 177)}...` : text;
      return { summary: preview, length: text.length };
    }

    default:
      throw new Error(`Unsupported AI task: ${task}`);
  }
}

/**
 * AI API Route
 * ----------------------
 * POST /api/wonderspace/ai
 * Handles AI module requests (CodeGen, Explainer, Optimizer, Visualizer)
 *
 * Server-enforced auth + paywall.
 * Runners can call this, but cannot bypass it.
 */
export async function POST(req: NextRequest) {
  try {
    // --- AUTH (Supabase or Smoke) ---
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);

    if (!user && !smokeUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --- PAYWALL (shared AI helper) ---
    const paidUser = await requirePaidAIUser(req);
    if (paidUser instanceof NextResponse) return paidUser;

    // --- REQUEST ---
    const body = await req.json().catch(() => null);
    const task = body?.task;
    const payload = body?.payload;

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing task" },
        { status: 400 }
      );
    }

    // Deterministic, production-safe handler
    const result = await runTask(task, payload);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    logger.error("AI API Error", { error: err });
    return NextResponse.json(
      { success: false, error: err?.message || "AI API Error" },
      { status: 500 }
    );
  }
}
