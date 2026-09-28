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
  const unauthorized = () => NextResponse.json(
    { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
    { status: 401 },
  );

  // Prefer the explicit browser/CLI Bearer identity when supplied. The project
  // storage layer uses this same token for RLS; never mix a cookie identity
  // from one account with the Bearer token from another account.
  if (req.headers.has("authorization")) {
    if (!/^Bearer\s+\S+$/i.test(req.headers.get("authorization")?.trim() || "")) return unauthorized();
    const userId = await requireUserId(req);
    return userId ? { userId } : unauthorized();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user?.id) return { userId: user.id };
  } catch {
    // Fail closed when the server session cannot be verified.
  }
  return unauthorized();
}
