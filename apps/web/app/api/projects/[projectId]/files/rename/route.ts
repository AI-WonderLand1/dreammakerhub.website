import { NextRequest, NextResponse } from 'next/server';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { renamePath } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

function validFilePath(value: string): boolean {
  return value.length >= 1 && value.length <= 512 && !value.startsWith('/') &&
    !/[\\\\\x00-\x1f\x7f]/.test(value) &&
    value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ ok: false, message: 'Valid JSON object required' }, { status: 400 });
    }
    const { oldPath, newPath } = body as Record<string, unknown>;
    if (typeof oldPath !== 'string' || typeof newPath !== 'string' ||
        !validFilePath(oldPath) || !validFilePath(newPath)) {
      return NextResponse.json({ ok: false, message: 'Safe relative oldPath and newPath are required' }, { status: 400 });
    }

    const { projectId } = await params;
    const moved = await renamePath(projectId, userId, oldPath, newPath);
    return NextResponse.json({ ok: true, moved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'Project rename source missing' || message === 'Project metadata missing' ||
        message === 'Project not found or forbidden') {
      return NextResponse.json({ ok: false, message: 'Project or source path not found' }, { status: 404 });
    }
    if (message === 'Project rename destination already exists' ||
        message === 'Cannot rename a path inside itself') {
      return NextResponse.json({ ok: false, message }, { status: 409 });
    }
    if (message === 'Invalid project file path') {
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }
    if (message === 'Forbidden') return NextResponse.json({ ok: false, message }, { status: 403 });
    logger.error('Rename file error:', err);
    return NextResponse.json({ ok: false, message: 'Unable to rename project files' }, { status: 500 });
  }
}
