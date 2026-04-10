import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { saveSceneToSupabase } from "@/lib/scene/supabase-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { sceneId, data } = await req.json();

    if (!sceneId || !data) {
      return NextResponse.json(
        { error: "sceneId and data are required" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let userId: string | undefined;

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    const result = await saveSceneToSupabase(sceneId, data, userId);

    return NextResponse.json({
      success: true,
      path: result.path
    });

  } catch (error: any) {
    console.error("Save scene error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save scene" },
      { status: 500 }
    );
  }
}