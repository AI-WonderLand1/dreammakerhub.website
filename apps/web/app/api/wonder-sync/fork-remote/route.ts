import { NextResponse } from "next/server";
import { getGit } from "../_git";
import { requireUserId } from "@/lib/auth";
import { logger } from '@/lib/logger';

const ALLOWED_REMOTE_PROTOCOLS = ["https://", "git@"];
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "metadata.google.internal"];

function isSafeRemoteUrl(url: string): boolean {
  if (!ALLOWED_REMOTE_PROTOCOLS.some(p => url.startsWith(p))) return false;
  try {
    if (url.startsWith("git@")) {
      const host = url.split("@")[1]?.split(":")[0];
      return host ? !BLOCKED_HOSTS.includes(host) : false;
    }
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
    if (parsed.hostname === "localhost" || /^127\./.test(parsed.hostname)) return false;
    if (/^169\.254\./.test(parsed.hostname)) return false; // link-local / cloud metadata
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (!isSafeRemoteUrl(url)) {
      return NextResponse.json(
        { ok: false, error: "Invalid or disallowed remote URL. Only HTTPS and SSH GitHub/GitLab URLs are permitted." },
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
