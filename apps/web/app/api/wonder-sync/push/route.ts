import { NextResponse } from "next/server";
import { getGit } from "../_git";

export async function POST() {
  try {
    const { git } = getGit();
    const res = await git.push();
    return NextResponse.json({ ok: true, res });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "push failed" },
      { status: 500 }
    );
  }
}
