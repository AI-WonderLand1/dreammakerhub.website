import { NextRequest, NextResponse } from 'next/server';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { listProjects, createProject } from '@/lib/projects/storage';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const projects = await listProjects(userId);
    return NextResponse.json({ ok: true, projects });
  } catch (err: any) {
    logger.error('List projects error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to list projects' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { name, tool } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ ok: false, message: 'name is required' }, { status: 400 });
    }

    const project = await createProject(userId, name.trim(), tool || 'wonderbuild');
    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (err: any) {
    logger.error('Create project error:', err);
    return NextResponse.json(
      { ok: false, message: err.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
