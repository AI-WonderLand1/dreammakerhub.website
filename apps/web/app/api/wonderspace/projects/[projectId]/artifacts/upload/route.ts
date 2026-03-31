import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { writeFile } from '@lib/projects/storage';
import { logger } from '@lib/logger';
import { getSmokeUserIdFromRequest } from '@lib/smokeAuth';

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);
  if (!user && !smokeUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projectId = params.projectId;
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  // Check if file is a File object
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const filePath = `uploads/${file.name}`;
  const content = Buffer.from(await file.arrayBuffer());

  try {
    await writeFile(projectId, smokeUserId ?? user!.id, filePath, content);
    return NextResponse.json({ ok: true, path: filePath });
  } catch (error: any) {
    logger.error("Upload file failed", { error });
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
