import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const SCENE_ID_RE = /^[a-zA-Z0-9_-]{1,120}$/;
const MAX_SCENE_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > MAX_SCENE_BYTES) {
      return NextResponse.json({ error: "Scene exceeds the 5 MB limit" }, { status: 413 });
    }

    const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return NextResponse.json({ error: "Sign in to save your scene" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Scene storage is not configured" }, { status: 503 });
    }

    const body = await req.json();
    const { sceneId, data } = body || {};
    if (typeof sceneId !== "string" || !SCENE_ID_RE.test(sceneId) ||
        !data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ error: "Valid sceneId and scene data are required" }, { status: 400 });
    }
    if (JSON.stringify(data).length > MAX_SCENE_BYTES) {
      return NextResponse.json({ error: "Scene exceeds the 5 MB limit" }, { status: 413 });
    }

    // Use the user's access token: database RLS must authorize scene writes.
    // Never use the service-role key to write user supplied scene IDs.
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: "Bearer " + token } },
    });
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) {
      return NextResponse.json({ error: "Session is invalid or expired" }, { status: 401 });
    }

    const { data: existing, error: lookupError } = await supabase.from("scenes")
      .select("user_id").eq("id", sceneId).maybeSingle();
    if (lookupError) {
      logger.warn("[scenes/save] Scene access check failed", lookupError);
      return NextResponse.json({ error: "Scene access could not be verified" }, { status: 503 });
    }
    if (existing && existing.user_id !== auth.user.id) {
      return NextResponse.json({ error: "This scene belongs to another user" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const { data: saved, error: saveError } = await supabase.from("scenes").upsert({
      id: sceneId,
      user_id: auth.user.id,
      name: typeof data.name === "string" ? data.name : "Untitled Scene",
      data,
      updated_at: now,
      ...(!existing ? { created_at: now } : {}),
    }, { onConflict: "id" }).select("id").single();

    if (saveError || !saved?.id) {
      logger.warn("[scenes/save] Database rejected scene write", saveError);
      return NextResponse.json({ error: "Scene was not saved. Check scene permissions and storage configuration." }, { status: 503 });
    }
    return NextResponse.json({ success: true, path: "scenes/" + sceneId });
  } catch (error) {
    logger.error("[scenes/save] Unexpected error", error);
    return NextResponse.json({ error: "Failed to save scene" }, { status: 500 });
  }
}
