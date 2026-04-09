import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

// GET - List versions for a scene
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sceneId = req.nextUrl.searchParams.get("sceneId");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

    if (!sceneId) {
      return NextResponse.json({ error: "sceneId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("scene_versions")
      .select("id, created_at, snapshot")
      .eq("scene_id", sceneId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions: data || [] });
  } catch (error) {
    console.error("[SceneVersions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - Save a new scene version
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { sceneId, data, snapshot } = body;

    if (!sceneId || !data) {
      return NextResponse.json({ error: "sceneId and data required" }, { status: 400 });
    }

    // Save version
    const { data: version, error: versionError } = await supabase
      .from("scene_versions")
      .insert({
        scene_id: sceneId,
        user_id: user.id,
        data,
        snapshot: snapshot || `Saved at ${new Date().toLocaleTimeString()}`,
      })
      .select()
      .single();

    if (versionError) {
      console.error("[SceneVersions] Insert error:", versionError);
    }

    // Keep only last 50 versions
    const { data: allVersions } = await supabase
      .from("scene_versions")
      .select("id")
      .eq("scene_id", sceneId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (allVersions && allVersions.length > 50) {
      const idsToDelete = allVersions.slice(50).map(v => v.id);
      await supabase
        .from("scene_versions")
        .delete()
        .in("id", idsToDelete);
    }

    return NextResponse.json({ 
      ok: true, 
      versionId: version?.id,
      message: "Scene version saved"
    });
  } catch (error) {
    console.error("[SceneVersions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT - Restore a scene version
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { versionId, sceneId } = body;

    if (!versionId || !sceneId) {
      return NextResponse.json({ error: "versionId and sceneId required" }, { status: 400 });
    }

    // Get the version
    const { data: version, error: fetchError } = await supabase
      .from("scene_versions")
      .select("data")
      .eq("id", versionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Save current state before restoring
    const { data: currentScene } = await supabase
      .from("scenes")
      .select("data")
      .eq("id", sceneId)
      .single();

    if (currentScene) {
      await supabase
        .from("scene_versions")
        .insert({
          scene_id: sceneId,
          user_id: user.id,
          data: currentScene.data,
          snapshot: "Auto-save before restore",
        });
    }

    // Restore the version
    const { error: updateError } = await supabase
      .from("scenes")
      .update({
        data: version.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sceneId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: version.data,
      message: "Scene version restored"
    });
  } catch (error) {
    console.error("[SceneVersions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE - Delete a scene version
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
      .from("scene_versions")
      .delete()
      .eq("id", versionId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SceneVersions] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}