import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: only allow authenticated or known client errors
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:5000",
    ];
    if (!allowedOrigins.some(o => origin.startsWith(o)) && !origin.includes("dreammakerhub.website")) {
      return NextResponse.json({ success: true }); // silently ignore untrusted sources
    }

    const body = await req.json();
    const { message, stack, url, userAgent, userId, timestamp } = body;

    const errorEntry = {
      message: message?.slice(0, 1000) || "Unknown error",
      stack: stack?.slice(0, 2000),
      url,
      user_agent: userAgent,
      user_id: userId === "anonymous" ? null : userId,
      created_at: timestamp || new Date().toISOString(),
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { error } = await supabase.from("client_error_logs").insert(errorEntry);
      if (error) {
        logger.error("Failed to log error:", error);
      }
    }

    logger.error("[CLIENT ERROR]", errorEntry);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error logging endpoint:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}