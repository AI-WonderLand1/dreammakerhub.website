import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getProjectFiles } from "@/lib/storage/projectFiles";
import { logger } from '@/lib/logger';

export const runtime = "nodejs";

const AUTO_SAVE_DEBOUNCE_MS = 5000;
const MAX_FILE_SIZE_MB = 10;

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { files, force } = await req.json();

    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: "Invalid files object" }, { status: 400 });
    }

    const fileSize = JSON.stringify(files).length;
    const sizeMB = fileSize / (1024 * 1024);
    
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return NextResponse.json({ 
        error: `File too large (${sizeMB.toFixed(1)}MB). Max: ${MAX_FILE_SIZE_MB}MB` 
      }, { status: 400 });
    }

    const fileKey = `projects/${projectId}/files.json`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('project-files')
      .upload(fileKey, JSON.stringify(files, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      logger.error("Auto-save upload failed:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    await supabase
      .from("projects")
      .update({ 
        metadata: {
          ...project.metadata,
          lastSavedAt: new Date().toISOString(),
          fileCount: Object.keys(files).length
        }
      })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
      fileCount: Object.keys(files).length,
      sizeBytes: fileSize
    });
  } catch (error: any) {
    logger.error("Auto-save error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name, metadata")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const fileKey = `projects/${projectId}/files.json`;
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('project-files')
      .download(fileKey);

    if (downloadError) {
      if (downloadError.message.includes('Not found')) {
        return NextResponse.json({ files: null, savedAt: null });
      }
      logger.error("Auto-save download failed:", downloadError);
      return NextResponse.json({ error: downloadError.message }, { status: 500 });
    }

    const files = JSON.parse(new TextDecoder().decode(fileData));
    const savedAt = project.metadata?.lastSavedAt;

    return NextResponse.json({
      files,
      savedAt,
      fileCount: Object.keys(files || {}).length
    });
  } catch (error: any) {
    logger.error("Auto-load error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}