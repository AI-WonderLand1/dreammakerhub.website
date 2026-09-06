import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export type PaidAIUser = {
  userId: string;
};

/**
 * Validates the user via Supabase session.
 *
 * Browser requests are verified through the SSR client so current Supabase
 * chunked auth cookies are handled correctly. Bearer-token callers (CLI/API)
 * keep the existing requireUserId fallback.
 *
 * Despite the historical function name, this helper currently enforces login,
 * not a paid subscription tier.
 */
export async function requirePaidAIUser(req: NextRequest): Promise<PaidAIUser | NextResponse> {
  let userId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user?.id) userId = user.id;
  } catch {
    // Fall through to explicit bearer-token verification below.
  }

  if (!userId && req.headers.get("authorization")?.startsWith("Bearer ")) {
    userId = await requireUserId(req);
  }

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
      { status: 401 },
    );
  }

  return { userId };
}
