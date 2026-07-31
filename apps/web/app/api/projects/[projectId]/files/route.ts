import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, listFiles, deletePath } from '@/lib/projects/storage';
import { requirePaidAIUser } from '@/app/api/ai/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const fileList = await listFiles(projectId, userId);
    const files: Record<string, string> = {};
    for (const fp of fileList) {
      const content = await readFile(projectId, userId, fp);
      if (content !== null) files[fp] = content;
    }
    return NextResponse.json({ files, projectId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const body = await req.json();
    const { files } = body;
    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: 'Files object required' }, { status: 400 });
    }
    for (const [filePath, content] of Object.entries(files)) {
      await writeFile(projectId, userId, filePath, content as string);
    }
    return NextResponse.json({
      success: true,
      projectId,
      savedAt: new Date().toISOString(),
      fileCount: Object.keys(files).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');
    if (!filePath) {
      return NextResponse.json({ error: 'path query param required' }, { status: 400 });
    }
    await deletePath(projectId, userId, filePath);
    return NextResponse.json({ success: true, deleted: filePath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
