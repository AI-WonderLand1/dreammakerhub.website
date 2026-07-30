import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";

export type PaidAIUser = {
  userId: string;
};

/**
 * Validates the user via Supabase session.
 * Wraps requireUserId with NextRequest/NextResponse types for AI routes.
 */
export async function requirePaidAIUser(req: NextRequest): Promise<PaidAIUser | NextResponse> {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
      { status: 401 },
    );
  }
  return { userId };
}
