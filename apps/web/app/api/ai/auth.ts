import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type PaidAIUser = {
  userId: string;
};

/**
 * Validates the user via Supabase session (not spoofable headers).
 * Trusts the Authorization cookie/header verified by Supabase, not client-supplied x-replit-* headers.
 */
export async function requirePaidAIUser(req: NextRequest): Promise<PaidAIUser | NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: "Auth not configured" } },
      { status: 500 },
    );
  }

  // Extract token from Authorization header or cookie
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");
  
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const sbMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (sbMatch) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sbMatch[1]));
        token = parsed.access_token;
      } catch {
        // fall through
      }
    }
  }

  if (!token) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
      { status: 401 },
    );
  }

  // Verify the token with Supabase (server-side, cannot be spoofed)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Invalid or expired token" } },
      { status: 401 },
    );
  }

  return { userId: user.id };
}
