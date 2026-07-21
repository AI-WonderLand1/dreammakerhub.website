import { NextResponse } from "next/server"
import { getStorageManager } from "@/lib/storage/StorageManager"
import { createClient } from "@supabase/supabase-js"
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

  const { workspaceId, sceneId, scene } = await req.json()

  if (!workspaceId || !sceneId || !scene) {
    return NextResponse.json({ error: "Missing required fields: workspaceId, sceneId, scene" }, { status: 400 })
  }

  const storage = getStorageManager()
  const result = await storage.saveProject(`${workspaceId}/${sceneId}`, scene, workspaceId)

  return NextResponse.json({ ok: true, path: result.url, id: result.id })
}
