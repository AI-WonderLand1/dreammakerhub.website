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

  const payload: unknown = await req.json().catch(() => null);
  const confirmationName = payload && typeof payload === 'object' && 'confirmationName' in payload
    ? (payload as { confirmationName: unknown }).confirmationName
    : undefined;
  if (typeof confirmationName !== 'string' || confirmationName.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Type the project name to confirm deletion.' },
      { status: 400 },
    );
  }

  const { projectId } = await params;
  let project;
  try {
    project = await getProjectMetadata(projectId, userId);
  } catch {
    return NextResponse.json({ ok: false, message: 'Project not found.' }, { status: 404 });
  }

  if (confirmationName !== project.name) {
    return NextResponse.json(
      { ok: false, message: 'The confirmation must exactly match the project name.' },
      { status: 409 },
    );
  }

  try {
    await deleteProject(projectId, userId, confirmationName);
    return NextResponse.json({ ok: true, message: 'Project deleted' });
  } catch (err: any) {
    if (err instanceof Error && err.message === 'Project name changed during deletion.') {
      return NextResponse.json({ ok: false, message: 'Project name changed. Reload and try again.' }, { status: 409 });
    }
    logger.error('Delete project error:', err);
    return NextResponse.json(
      { ok: false, message: 'Failed to delete project.' },
      { status: 500 }
    );
  }
}
