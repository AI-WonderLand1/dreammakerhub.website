import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: assets, error } = await supabase
    .from("user_assets")
    .select("*")
    .eq("user_id", session.user.id)
    .order("downloaded_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (assets || []).map((a) => ({
    id: a.asset_id,
    name: a.name,
    source: a.source,
    downloadUrl: a.local_url,
    thumbnailUrl: "",
  }));

  return NextResponse.json({ assets: formatted });
}