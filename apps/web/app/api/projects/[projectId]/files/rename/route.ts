import { NextRequest, NextResponse } from 'next/server';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { renameFile } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const { oldPath, newPath } = await req.json();

    if (!oldPath || !newPath) {
      return NextResponse.json(
        { ok: false, message: 'oldPath and newPath are required' },
        { status: 400 }
      );
    }

    await renameFile(projectId, userId, oldPath, newPath);

    return NextResponse.json({ ok: true, message: `Renamed ${oldPath} → ${newPath}` });
  } catch (err: any) {
    logger.error('Rename file error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to rename' },
      { status: 500 }
    );
  }
}
