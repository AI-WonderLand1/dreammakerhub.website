import { NextResponse } from "next/server";
import { getGit } from "../_git";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

async function requireAuth(req: Request): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const authHeader = req.headers.get("authorization");
  const cookieHeader = req.headers.get("cookie");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) { token = authHeader.slice(7); }
  else if (cookieHeader) { const m = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/); if (m) { try { token = JSON.parse(decodeURIComponent(m[1])).access_token; } catch {} } }
  if (!token) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(req: Request) {
  const userId = await requireAuth(req);
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