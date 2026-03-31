import { NextResponse } from "next/server";
import { getGit } from "../_git";

export async function POST(req: Request) {
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
