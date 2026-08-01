import { NextRequest, NextResponse } from 'next/server';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { createRevision, listRevisions, restoreRevision } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const ownerId = (auth as { userId: string }).userId;
  const { projectId } = await params;

  try {
    const revisions = await listRevisions(projectId, ownerId);
    return NextResponse.json({ revisions });
  } catch (err: any) {
    logger.error('[revisions] list failed', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const ownerId = (auth as { userId: string }).userId;
  const { projectId } = await params;

  try {
    const body = await req.json();
    const snapshot = body?.snapshot ?? body?.state ?? null;
    const label = typeof body?.label === 'string' ? body.label : undefined;
    if (snapshot === null) {
      return NextResponse.json({ error: 'snapshot is required' }, { status: 400 });
    }
    const revision = await createRevision(projectId, ownerId, snapshot, { label });
    return NextResponse.json({ revision });
  } catch (err: any) {
    logger.error('[revisions] create failed', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const ownerId = (auth as { userId: string }).userId;
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const revisionId = searchParams.get('revisionId');
  if (!revisionId) {
    return NextResponse.json({ error: 'revisionId query param required' }, { status: 400 });
  }
  try {
    const revision = await restoreRevision(projectId, ownerId, revisionId);
    return NextResponse.json({ revision });
  } catch (err: any) {
    logger.error('[revisions] restore failed', err);
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
