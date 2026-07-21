import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

// GET - List versions for a project
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("project_versions")
      .select("id, created_at, snapshot")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions: data || [] });
  } catch (error) {
    logger.error("[Versions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Save a new version
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, content, snapshot } = body;

    if (!projectId || !content) {
      return NextResponse.json({ error: "projectId and content required" }, { status: 400 });
    }

    // Save version
    const { data: version, error: versionError } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        user_id: user.id,
        content,
        snapshot: snapshot || `Saved at ${new Date().toLocaleTimeString()}`,
      })
      .select()
      .single();

    if (versionError) {
      logger.error("[Versions] Insert error:", versionError);
      // Continue even if version save fails
    }

    // Keep only last 50 versions
    const { data: allVersions } = await supabase
      .from("project_versions")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (allVersions && allVersions.length > 50) {
      const idsToDelete = allVersions.slice(50).map(v => v.id);
      await supabase
        .from("project_versions")
        .delete()
        .in("id", idsToDelete);
    }

    return NextResponse.json({ 
      ok: true, 
      versionId: version?.id,
      message: "Version saved"
    });
  } catch (error) {
    logger.error("[Versions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT - Restore a version
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { versionId, projectId } = body;

    if (!versionId || !projectId) {
      return NextResponse.json({ error: "versionId and projectId required" }, { status: 400 });
    }

    // Get the version
    const { data: version, error: fetchError } = await supabase
      .from("project_versions")
      .select("content")
      .eq("id", versionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Save current state as new version before restoring
    const { data: currentProject } = await supabase
      .from("puck_projects")
      .select("content")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (currentProject) {
      await supabase
        .from("project_versions")
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: currentProject.content,
          snapshot: `Auto-save before restore`,
        });
    }

    // Restore the version
    const { error: updateError } = await supabase
      .from("puck_projects")
      .update({
        content: version.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      content: version.content,
      message: "Version restored"
    });
  } catch (error) {
    logger.error("[Versions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE - Delete a specific version
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const versionId = req.nextUrl.searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json({ error: "versionId required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("project_versions")
      .delete()
      .eq("id", versionId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("[Versions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}