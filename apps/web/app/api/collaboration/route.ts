import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

async function ownedProject(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, projectId: string, userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId")?.trim();
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (!await ownedProject(supabase, projectId, user.id)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("collaboration_sessions")
      .select("project_id,user_id,last_seen,is_active,cursor_position")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("last_seen", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logger.error("[collaboration] load failed", error);
    return NextResponse.json({ error: "Failed to load collaboration sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const input = await req.json().catch(() => null);
  const projectId = input && typeof input === "object" && typeof input.projectId === "string"
    ? input.projectId.trim()
    : "";
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (!await ownedProject(supabase, projectId, user.id)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("collaboration_sessions")
      .upsert({
        project_id: projectId,
        user_id: user.id,
        cursor_position: input.cursorPosition ?? null,
        is_active: input.active !== false,
        last_seen: new Date().toISOString(),
      }, { onConflict: "project_id,user_id" });

    if (error) throw error;
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logger.error("[collaboration] update failed", error);
    return NextResponse.json({ error: "Failed to update collaboration session" }, { status: 500 });
  }
}
