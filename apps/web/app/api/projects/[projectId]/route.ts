import { NextRequest, NextResponse } from 'next/server';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { getProjectMetadata, deleteProject } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { projectId } = await params;
    const project = await getProjectMetadata(projectId, userId);
    return NextResponse.json({ ok: true, project });
  } catch (err: any) {
    logger.error('Get project error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Project not found' },
      { status: 404 }
    );
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
    await deleteProject(projectId, userId);
    return NextResponse.json({ ok: true, message: 'Project deleted' });
  } catch (err: any) {
    logger.error('Delete project error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
