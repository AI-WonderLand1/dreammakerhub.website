import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { coderServiceClient } from '@/lib/coder/workspace-slots.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ projectId: string }> };
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

async function authorize(request: Request, projectId: string) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!projectId || projectId.length > 200) {
    return { error: NextResponse.json({ error: 'Invalid project ID' }, { status: 400 }) };
  }
  const db = coderServiceClient();
  const project = await db.from('_projects').select('id').eq('id', projectId)
    .eq('owner_id', user.id).maybeSingle();
  if (project.error) throw new Error('Project lookup unavailable');
  if (!project.data) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  return { db, userId: user.id };
}

function unavailable() {
  return NextResponse.json({ error: 'Project-workspace mapping unavailable' }, {
    status: 503, headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const auth = await authorize(request, projectId);
    if (auth.error) return auth.error;
    const { data, error } = await auth.db!.from('project_coder_workspace_links')
      .select('slot_id,created_at').eq('project_id', projectId);
    if (error) return unavailable();
    const slots = await auth.db!.from('coder_workspace_slots')
      .select('id,workspace_id,workspace_name,state').eq('user_id', auth.userId!)
      .is('released_at', null);
    if (slots.error) return unavailable();
    const owned = new Map((slots.data || []).map((slot) => [slot.id, slot]));
    const links = (data || []).filter((link) => owned.has(link.slot_id)).map((link) => ({
      slotId: link.slot_id, createdAt: link.created_at,
      workspace: owned.get(link.slot_id),
    }));
    return NextResponse.json({ projectId, links }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return unavailable(); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const auth = await authorize(request, projectId);
    if (auth.error) return auth.error;
    const body: unknown = await request.json().catch(() => null);
    const slotId = body && typeof body === 'object' && !Array.isArray(body) && 'slotId' in body
      ? (body as { slotId: unknown }).slotId : null;
    if (typeof slotId !== 'string' || !UUID.test(slotId)) {
      return NextResponse.json({ error: 'Valid workspace slot ID required' }, { status: 400 });
    }
    const slot = await auth.db!.from('coder_workspace_slots').select('id')
      .eq('id', slotId).eq('user_id', auth.userId!).is('released_at', null)
      .in('state', ['reserved', 'provisioned']).maybeSingle();
    if (slot.error) return unavailable();
    if (!slot.data) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    const { error } = await auth.db!.from('project_coder_workspace_links')
      .upsert({ project_id: projectId, slot_id: slotId }, { onConflict: 'project_id,slot_id', ignoreDuplicates: true });
    if (error) return unavailable();
    return NextResponse.json({ projectId, slotId, linked: true, synced: false }, {
      status: 201, headers: { 'Cache-Control': 'no-store' },
    });
  } catch { return unavailable(); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const auth = await authorize(request, projectId);
    if (auth.error) return auth.error;
    const body: unknown = await request.json().catch(() => null);
    const slotId = body && typeof body === 'object' && !Array.isArray(body) && 'slotId' in body
      ? (body as { slotId: unknown }).slotId : null;
    if (typeof slotId !== 'string' || !UUID.test(slotId)) {
      return NextResponse.json({ error: 'Valid workspace slot ID required' }, { status: 400 });
    }
    // Require ownership of the workspace before modifying a link.
    const slot = await auth.db!.from('coder_workspace_slots').select('id')
      .eq('id', slotId).eq('user_id', auth.userId!).maybeSingle();
    if (slot.error) return unavailable();
    if (!slot.data) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    const { error } = await auth.db!.from('project_coder_workspace_links')
      .delete().eq('project_id', projectId).eq('slot_id', slotId);
    if (error) return unavailable();
    return NextResponse.json({ projectId, slotId, linked: false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return unavailable(); }
}
