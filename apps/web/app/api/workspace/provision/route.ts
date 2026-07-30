import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-service';
import { requireUserId } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sceneId } = await request.json();

    if (!sceneId) {
      return NextResponse.json({ error: 'sceneId required' }, { status: 400 });
    }

    // Check if workspace already exists
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id, status')
      .eq('scene_id', sceneId)
      .single();

    if (existing) {
      return NextResponse.json({
        status: 'exists',
        workspaceId: existing.id,
        message: 'Workspace already provisioned'
      });
    }

    // Create new workspace record
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        scene_id: sceneId,
        status: 'READY',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Workspace creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create workspace record', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'provisioned',
      workspaceId: workspace?.id || sceneId,
      message: 'Workspace provisioned successfully'
    });

  } catch (error) {
    logger.error('Workspace provision error:', error);
    return NextResponse.json(
      { error: 'Workspace provisioning failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sceneId = searchParams.get('sceneId');

  if (!sceneId) {
    return NextResponse.json({ error: 'sceneId required' }, { status: 400 });
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('scene_id', sceneId)
    .single();

  return NextResponse.json({
    exists: !!workspace,
    workspace: workspace
  });
}