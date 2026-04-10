import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const BUCKET_NAME = "3d-assets";

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Try to get the file from the 3d-assets bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filename);

    if (error) {
      console.error("Download error:", error);
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
    console.error("Failed to download asset:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}