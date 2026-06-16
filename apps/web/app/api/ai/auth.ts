import { NextRequest, NextResponse } from "next/server";

export type PaidAIUser = {
  userId: string;
};

export async function requirePaidAIUser(req: NextRequest): Promise<PaidAIUser | NextResponse> {
<<<<<<< HEAD
  const supabase = await createClient();
  const {
    data: { user },
} = await (await supabase).auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
=======
  const userId = req.headers.get("x-replit-user-id");
  const userName = req.headers.get("x-replit-user-name");
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

  if (!userId || !userName) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
      { status: 401 },
    );
  }

  return { userId };
}
