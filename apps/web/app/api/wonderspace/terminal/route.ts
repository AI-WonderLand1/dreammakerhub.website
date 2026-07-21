import { NextResponse } from "next/server";
import { runAI } from "../../wonder-build/ai-router";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

async function requireAuth(req: Request): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) { token = authHeader.slice(7); }
  else if (cookieHeader) { const m = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/); if (m) { try { token = JSON.parse(decodeURIComponent(m[1])).access_token; } catch {} } }
  if (!token) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * WonderSpace Terminal API
 * Executes WonderSpace low-code commands via shared AI router
 * Used by Wonder-Build, Playground, and other connected modules
 */

export async function POST(req: Request) {
  const userId = await requireAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { command } = await req.json();

    if (!command || command.trim().length === 0) {
      return NextResponse.json({ error: "Missing command" }, { status: 400 });
    }

    const aiResponse = await runAI(
      "terminal-exec",
      `Execute this WonderSpace low-code command:\n\n${command}`
    );

    return NextResponse.json({
      success: true,
      command,
      output: aiResponse,
    });
  } catch (err: any) {
    logger.error("❌ WonderSpace terminal error:", err);
    return NextResponse.json(
      { error: "Failed to execute terminal command" },
      { status: 500 }
    );
  }
}
