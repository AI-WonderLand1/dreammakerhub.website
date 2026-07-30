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
    
    const remotes = await git.getRemotes();
    if (!remotes.length) {
      throw new Error("No remotes configured for this repository.");
    }
    const remote = remotes[0].name;

    const branch = await git.branch();
    const currentBranch = branch.current;
    if (!currentBranch) {
      throw new Error("Not currently on a git branch, cannot push.");
    }

    const res = await git.push(remote, currentBranch, {
      "--set-upstream": null,
    });
    return NextResponse.json({ ok: true, res });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "push failed" },
      { status: 500 }
    );
  }
}