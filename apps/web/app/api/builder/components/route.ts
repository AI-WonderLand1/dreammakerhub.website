import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("components")
      .select("id, name, category, content, styles, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ components: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch components", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}
