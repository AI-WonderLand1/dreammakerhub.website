import { NextResponse } from "next/server";
import { getGit } from "../_git";

export async function GET() {
  try {
    const { git, root } = getGit();
    const status = await git.status();
    const branch = await git.branch();
    const remotes = await git.getRemotes(true);

    // ahead/behind is in status for many setups; we also compute from tracking if possible
    const ahead = status.ahead ?? 0;
    const behind = status.behind ?? 0;

    return NextResponse.json({
      ok: true,
      root,
      current: branch.current,
      ahead,
      behind,
      files: {
        created: status.created,
        deleted: status.deleted,
        modified: status.modified,
        renamed: status.renamed,
        not_added: status.not_added,
        conflicted: status.conflicted,
        staged: status.staged,
      },
      clean: status.isClean(),
      remotes,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "status failed" },
      { status: 500 }
    );
  }
}
