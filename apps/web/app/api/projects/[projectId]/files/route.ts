import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, listFiles, deleteFile } from '@/lib/projects/storage';
import { requirePaidAIUser } from '@/app/api/ai/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requirePaidAIUser();
    const ownerId = user.id;
    const fileList = await listFiles(params.projectId, ownerId);
    const files: Record<string, string> = {};
    for (const fp of fileList) {
      const content = await readFile(params.projectId, ownerId, fp);
      if (content !== null) files[fp] = content;
    }
    return NextResponse.json({ files, projectId: params.projectId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requirePaidAIUser();
    const ownerId = user.id;
    const body = await req.json();
    const { files } = body;
    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: 'Files object required' }, { status: 400 });
    }
    for (const [filePath, content] of Object.entries(files)) {
      await writeFile(params.projectId, ownerId, filePath, content as string);
    }
    return NextResponse.json({
      success: true,
      projectId: params.projectId,
      savedAt: new Date().toISOString(),
      fileCount: Object.keys(files).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requirePaidAIUser();
    const ownerId = user.id;
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) {
      return NextResponse.json({ error: 'path query param required' }, { status: 400 });
    }
    await deleteFile(params.projectId, ownerId, filePath);
    return NextResponse.json({ success: true, deleted: filePath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
