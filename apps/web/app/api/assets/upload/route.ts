import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["glb", "gltf"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Only .glb and .gltf files are supported" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    
    // Limit file size to 50MB
    if (buffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    const safeName = (name || file.name).replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${userId}/${safeName}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("3d-assets")
      .upload(fileName, buffer, {
        contentType: ext === "glb" ? "model/gltf-binary" : "model/gltf+json",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("3d-assets")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("user_assets").insert({
      user_id: userId,
      asset_id: `upload-${Date.now()}`,
      name: safeName,
      source: "local",
      local_url: publicUrl,
      downloaded_at: new Date().toISOString(),
    });

    if (insertError) {
      logger.warn("Failed to record asset in database:", insertError);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: safeName,
      format: ext,
    });
  } catch (error) {
    logger.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: assets } = await supabase
    .from("user_assets")
    .select("*")
    .eq("user_id", session.user.id)
    .order("downloaded_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ assets: assets || [] });
}