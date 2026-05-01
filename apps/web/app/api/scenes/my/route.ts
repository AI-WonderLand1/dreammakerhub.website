import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { listUserScenes } from "@/lib/scene/supabase-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const scenes = await listUserScenes(user.id);

    return NextResponse.json({ scenes });
  } catch (error: any) {
    console.error("Failed to list user scenes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load scenes" },
      { status: 500 }
    );
  }
}
