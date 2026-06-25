import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/app/utils/supabase/server";
import {
  getUserConfessions,
  searchMem0Confessions,
  isMem0Enabled,
} from "@/lib/ai/mem0Client";
import { getConfessionConfig } from "@/lib/ai/confessionConfig";

export const runtime = "nodejs";

const requestSchema = z.object({
  projectId: z.string().optional(),
  query: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export async function GET(req: NextRequest) {
  const traceId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" }, traceId },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get("projectId") || undefined;
    const query = searchParams.get("query") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const plan = req.headers.get("x-plan") || null;
    const config = getConfessionConfig(plan, isMem0Enabled());

    if (!config.enableMem0) {
      return NextResponse.json({
        ok: true,
        confessions: [],
        source: "disabled",
        message: "Mem0 memory is not enabled",
      });
    }

    let confessions;

    if (query) {
      confessions = await searchMem0Confessions(user.id, query, limit);
    } else {
      confessions = await getUserConfessions(user.id, projectId, limit);
    }

    return NextResponse.json({
      ok: true,
      confessions,
      source: "mem0",
      mode: config.mode,
    });
  } catch (error: any) {
    console.error("Confessions fetch error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: error.message || "Internal error" }, traceId },
      { status: 500 }
    );
  }
}
