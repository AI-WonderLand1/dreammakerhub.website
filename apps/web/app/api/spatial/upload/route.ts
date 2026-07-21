import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { getSmokeUserIdFromRequest } from "@/lib/smokeAuth";
import { supabaseServer } from "@/lib/supabaseServer";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const SPLAT_BUCKET = "splat-sources";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/heic",
  "video/mp4", "video/quicktime", "video/webm",
];

async function ensureBucket() {
  try {
    await supabaseServer.storage.createBucket(SPLAT_BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  } catch {
    // Bucket already exists
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const smokeUserId = getSmokeUserIdFromRequest(req);

    if (!user && !smakeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = smokeUserId ?? user!.id;

    const formData = await req.formData();
    const projectId = formData.get("projectId") as string | null;
    const sourceType = (formData.get("sourceType") as string) || "photos";

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith("file")) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    await ensureBucket();

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: exceeds 50 MB limit`);
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported type ${file.type}`);
        continue;
      }

      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabaseServer.storage
        .from(SPLAT_BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (error) {
        errors.push(`${file.name}: ${error.message}`);
        continue;
      }

      const { data: publicUrl } = supabaseServer.storage
        .from(SPLAT_BUCKET)
        .getPublicUrl(path);

      uploadedUrls.push(publicUrl.publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: "All uploads failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      uploaded: uploadedUrls.length,
      urls: uploadedUrls,
      sourceType,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    logger.error("Splat upload error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
