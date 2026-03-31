import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@lib/smokeAuth";

export type PaidAIUser = {
  userId: string;
};

export async function requirePaidAIUser(req: NextRequest): Promise<PaidAIUser | NextResponse> {
  const supabase = createClient();
  const {
    data: { user },
} = await (await supabase).auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);

  if (!user && !smokeUserId) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
      { status: 401 },
    );
  }

  const isPaid = Boolean(user?.app_metadata?.plan === "pro" || smokeUserId);
  if (!isPaid) {
    return NextResponse.json(
      { ok: false, error: { code: "PAYWALL", message: "Upgrade required for AI access" } },
      { status: 402 },
    );
  }

  return { userId: smokeUserId ?? user!.id };
}
