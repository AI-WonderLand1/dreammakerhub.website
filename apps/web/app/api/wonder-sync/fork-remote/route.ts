import { NextResponse } from "next/server";
import { getGit } from "../_git";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = String(body?.url ?? "").trim();
    const name = String(body?.name ?? "fork").trim() || "fork";

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Remote URL is required" },
        { status: 400 }
      );
    }

    const { git } = getGit();
    const remotes = await git.getRemotes(true);

    const already = remotes.find((r) => r.name === name);
    if (already) {
      await git.remote(["set-url", name, url]);
    } else {
      await git.addRemote(name, url);
    }

    return NextResponse.json({ ok: true, name, url });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "fork remote failed" },
      { status: 500 }
    );
  }
}
