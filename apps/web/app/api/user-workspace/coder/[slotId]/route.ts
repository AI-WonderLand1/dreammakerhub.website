import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { coderApiRequest, getCoderSlot, markCoderSlotDeleting, releaseDeletedCoderSlot } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slotId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slotId } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(slotId)) return NextResponse.json({ error: 'Invalid slot ID' }, { status: 400 });
  try {
    const slot = await getCoderSlot(user.id, slotId);
    if (!slot) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    if (!slot.workspace_id || slot.state === 'reserved') {
      // A timed-out provisioning request may already have a running pod. An
      // administrator must reconcile it by name before safely releasing it.
      return NextResponse.json({ error: 'This workspace may still be provisioning. Contact support to reconcile its Coder ID; no allocation was freed.' }, { status: 409 });
    }
    // A 404 from an unrelated reverse proxy or misrouted host is NOT proof
    // that Coder deleted a workspace. Verify Coder's own build-info endpoint.
    const buildInfoResponse = await coderApiRequest('/api/v2/buildinfo', 'GET');
    const buildInfo = buildInfoResponse.ok ? await buildInfoResponse.json().catch(() => null) : null;
    if (typeof buildInfo?.version !== 'string' || !buildInfo.version.trim()) {
      throw new CostGateError('Coder server identity could not be verified. Slot remains allocated.');
    }
    const path = `/api/v2/workspaces/${encodeURIComponent(slot.workspace_id)}`;
    const current = await coderApiRequest(path, 'GET');
    if (current.status === 404) {
      await markCoderSlotDeleting(user.id, slot.id);
      await releaseDeletedCoderSlot(user.id, slot.id, slot.workspace_id);
      return NextResponse.json({ deleted: true, message: 'Coder confirmed workspace is absent; slot released.' });
    }
    if (!current.ok) throw new CostGateError('Cannot confirm Coder workspace state. Slot remains allocated.');
    const workspace = await current.json().catch(() => null);
    if (workspace?.id !== slot.workspace_id || workspace?.name !== slot.workspace_name) {
      throw new CostGateError('Coder workspace identity mismatch. Slot remains allocated.');
    }
    if (workspace?.latest_build?.status === 'failed' && workspace?.latest_build?.transition === 'delete') {
      throw new CostGateError('Coder deletion failed. Slot remains allocated pending administrator cleanup.');
    }
    if (slot.state !== 'deleting' && workspace?.latest_build?.transition !== 'delete') {
      // Coder deletes workspaces through a transition build, not through DELETE
      // /workspaces/{id}. A successful POST only queues deletion, not cleanup.
      const deletion = await coderApiRequest(`${path}/builds`, 'POST', { transition: 'delete' });
      if (!deletion.ok) throw new CostGateError('Coder did not accept workspace deletion. Slot remains allocated.');
    }
    await markCoderSlotDeleting(user.id, slot.id);
    const verification = await coderApiRequest(path, 'GET');
    if (verification.status === 404) {
      await releaseDeletedCoderSlot(user.id, slot.id, slot.workspace_id);
      return NextResponse.json({ deleted: true, message: 'Coder confirmed deletion; slot released.' });
    }
    if (!verification.ok) throw new CostGateError('Coder deletion status is unknown. Slot remains allocated.');
    return NextResponse.json({ deleted: false, message: 'Deletion is in progress. Your slot stays reserved until Coder confirms deletion. Retry this action in a moment.' }, { status: 202 });
  } catch (cause) {
    return costGateResponse(cause);
  }
}
