import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
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
        console.error("Failed to log error:", error);
      }
    }

    console.error("[CLIENT ERROR]", errorEntry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging endpoint:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}