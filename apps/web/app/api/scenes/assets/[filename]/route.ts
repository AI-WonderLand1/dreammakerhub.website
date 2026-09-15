import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const BUCKET_NAME = "3d-assets";
const ALLOWED_EXTENSIONS = new Set(["json", "scene", "glb", "gltf", "bin", "png", "jpg", "jpeg", "webp"]);

function getPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!supabaseUrl || !publicKey) return null;
  return createClient(supabaseUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function contentTypeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
    case 'scene': return 'application/json';
    case 'glb': return 'model/gltf-binary';
    case 'gltf': return 'model/gltf+json';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (
      !filename ||
      filename.length > 255 ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.startsWith('.')
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const supabase = getPublicSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    // Public assets must be readable under normal storage policies. Never use
    // the service role to turn this anonymous endpoint into a private-bucket oracle.
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filename);

    if (error || !data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypeFor(filename),
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, '')}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error: unknown) {
    logger.error("Failed to download asset:", error);
    return NextResponse.json({ error: "Failed to download asset" }, { status: 500 });
  }
}
