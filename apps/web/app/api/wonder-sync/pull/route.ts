import { NextResponse } from "next/server";
import { getGit } from "../_git";
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { git } = getGit();
    const res = await git.pull();
    return NextResponse.json({ ok: true, res });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "pull failed" },
      { status: 500 }
    );
  }
}
