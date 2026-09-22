import { NextRequest, NextResponse } from 'next/server';
import { writeFiles, readFile, listFiles, deletePath } from '@/lib/projects/storage';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { logger } from '@/lib/logger';

type Params = { params: Promise<{ projectId: string }> };

function validFilePath(value: string): boolean {
  return Boolean(value) && !value.startsWith('/') && !/[\\\x00-\x1f\x7f]/.test(value) &&
    value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

function handleProjectError(error: unknown, action: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'Forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (message === 'Project metadata missing') {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  logger.error(`Project files ${action} failed`, error);
  return NextResponse.json({ error: 'Unable to access project files' }, { status: 500 });
}

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePaidAIUser(req);
  if (!('userId' in auth)) return auth as NextResponse;

  try {
    const { projectId } = await params;
    const fileList = await listFiles(projectId, auth.userId);
    const files: Record<string, string> = {};
    for (const path of fileList) {
      const content = await readFile(projectId, auth.userId, path);
      if (content !== null) files[path] = content;
    }
    return NextResponse.json({ files, projectId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleProjectError(error, 'read');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requirePaidAIUser(req);
  if (!('userId' in auth)) return auth as NextResponse;

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Valid JSON object required' }, { status: 400 });
  }
  const files = (body as Record<string, unknown>).files;
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    return NextResponse.json({ error: 'Files must be a JSON object' }, { status: 400 });
  }

  // Validate the entire payload before writing any file. One bulk database
  // upsert avoids an ambiguous partial success from a per-file write loop.
  const entries: Array<{ path: string; content: string }> = [];
  for (const [filePath, content] of Object.entries(files)) {
    if (!validFilePath(filePath) || typeof content !== 'string') {
      return NextResponse.json({ error: 'Each file needs a safe relative path and string content' }, { status: 400 });
    }
    entries.push({ path: filePath, content });
  }

  try {
    const { projectId } = await params;
    await writeFiles(projectId, auth.userId, entries);
    return NextResponse.json({ success: true, projectId, savedAt: new Date().toISOString(), fileCount: entries.length });
  } catch (error) {
    return handleProjectError(error, 'save');
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePaidAIUser(req);
  if (!('userId' in auth)) return auth as NextResponse;

  const filePath = req.nextUrl.searchParams.get('path');
  if (!filePath || !validFilePath(filePath)) {
    return NextResponse.json({ error: 'A valid relative path is required' }, { status: 400 });
  }

  try {
    const { projectId } = await params;
    const deletedCount = await deletePath(projectId, auth.userId, filePath);
    if (deletedCount === 0) {
      return NextResponse.json({ error: 'File or folder not found', deletedCount: 0 }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: filePath, deletedCount });
  } catch (error) {
    return handleProjectError(error, 'delete');
  }
}
