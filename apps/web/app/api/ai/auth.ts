import { NextRequest, NextResponse } from "next/server";

export type PaidAIUser = {
  userId: string;
};

export async function requirePaidAIUser(req: NextRequest): Promise<PaidAIUser | NextResponse> {
  const userId = req.headers.get("x-replit-user-id");
  const userName = req.headers.get("x-replit-user-name");

  if (!userId || !userName) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", message: "Login required" } },
      { status: 401 },
    );
  }

  return { userId };
}
