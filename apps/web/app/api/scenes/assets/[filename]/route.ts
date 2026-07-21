import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const BUCKET_NAME = "3d-assets";

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // SECURITY: Block path traversal attempts
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.startsWith('.')) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filename);

    if (error) {
      logger.error("Download error:", error);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Return the file
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    logger.error("Failed to download asset:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}