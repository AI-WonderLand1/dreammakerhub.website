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
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Commit message is required" },
        { status: 400 }
      );
    }

    const { git } = getGit();

    // stage everything
    await git.add(["-A"]);

    const res = await git.commit(message);
    return NextResponse.json({ ok: true, res });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "commit failed" },
      { status: 500 }
    );
  }
}
