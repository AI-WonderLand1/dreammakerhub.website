import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@infra/lib/supabase/server-client";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  try {
    const { data: canvasData } = await req.json();

    // Version 2 Logic: Perform an upsert on canvas_states indexed by project_id
    const { data, error } = await supabase
      .from("canvas_states")
      .upsert(
        { 
          project_id: projectId, 
          elements: canvasData.assets || {},
          css: canvasData.styles || "",
          updated_at: new Date().toISOString()
        },
        { onConflict: "project_id" }
      )
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Canvas Save Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const { data, error } = await supabase
    .from("canvas_states")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error && error.code !== "PGRST116") { // Ignore "not found" error for new projects
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || {} });
}

