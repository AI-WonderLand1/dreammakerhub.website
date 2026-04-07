import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { projectId, content, meta } = body;

    if (!projectId || !content) {
      return NextResponse.json(
        { ok: false, error: "projectId and content required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("puck_projects")
      .upsert(
        {
          id: projectId,
          user_id: user.id,
          content,
          meta: meta || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[PuckSave] Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      projectId,
      url: `/wonder-build/puck?project=${projectId}`,
    });
  } catch (error) {
    console.error("[PuckSave] Error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const projectId = req.nextUrl.searchParams.get("projectId");

    if (projectId) {
      const { data, error } = await supabase
        .from("puck_projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { ok: false, error: "Project not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true, project: data });
    }

    const { data, error } = await supabase
      .from("puck_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, projects: data || [] });
  } catch (error) {
    console.error("[PuckLoad] Error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "projectId required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("puck_projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PuckDelete] Error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
