import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let userId: string | undefined;

    if (token && supabaseUrl && anonKey) {
      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
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