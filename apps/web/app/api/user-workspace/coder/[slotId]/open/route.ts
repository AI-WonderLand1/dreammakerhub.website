import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import {
  assertCoderOwnerIsolation,
  coderApiConfig,
  coderApiRequest,
  getCoderSlot,
} from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slotId: string }> };
type CoderIdentity = { id?: string; username?: string };
type CoderWorkspace = {
  id?: string;
  name?: string;
  owner_id?: string;
  owner_name?: string;
  status?: string;
  latest_build?: { status?: string; transition?: string };
};

const noStore = { 'Cache-Control': 'private, no-store' };
const slotIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicCoderOrigin(): string {
  const configured = process.env.CODER_ACCESS_URL;
  if (!configured) throw new CostGateError('The public Coder address is not configured.');
  let url: URL;
  try { url = new URL(configured); }
  catch { throw new CostGateError('The public Coder address is invalid.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new CostGateError('The public Coder address must be an HTTPS origin.');
  }
  return url.origin;
}

/** This shared-token path is ONLY for the single site operator, not customers. */
function assertSoleOperator(userId: string) {
  assertCoderOwnerIsolation(userId);
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const operatorId = process.env.CODER_OPERATOR_SUPABASE_ID?.trim();
  if (operatorId ? (operatorId !== userId || !adminIds.includes(operatorId)) :
    (adminIds.length !== 1 || adminIds[0] !== userId)) {
    throw new CostGateError('The private IDE owner is not uniquely configured.');
  }
}

async function openExistingWorkspace(userId: string, slotId: string, start: boolean) {
  assertSoleOperator(userId); // Before any privileged Coder request.
  const slot = await getCoderSlot(userId, slotId); // Scope to Supabase Auth user, never a client-supplied owner.
  if (!slot) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404, headers: noStore });
  if (slot.state !== 'provisioned' || !slot.workspace_id) {
    return NextResponse.json({ error: 'Workspace allocation is not ready. No new workspace was created.' }, { status: 409, headers: noStore });
  }
  if (slot.coder_api_origin !== coderApiConfig().url) {
    throw new CostGateError('This workspace belongs to a different Coder deployment. Contact support.');
  }

  // The API token must actually belong to the recorded workspace's Coder owner.
  // A Supabase user UUID alone is NOT a Coder login or proof of workspace ownership.
  const identityResponse = await coderApiRequest('/api/v2/users/me', 'GET');
  if (!identityResponse.ok) throw new CostGateError('Coder could not verify its authenticated owner.');
  const identity = await identityResponse.json().catch(() => null) as CoderIdentity | null;
  if (!identity?.id || !identity.username) throw new CostGateError('Coder returned an invalid owner identity.');

  const workspacePath = `/api/v2/workspaces/${encodeURIComponent(slot.workspace_id)}`;
  const currentResponse = await coderApiRequest(workspacePath, 'GET');
  if (!currentResponse.ok) throw new CostGateError('Coder could not verify the existing workspace. No new workspace was created.');
  const workspace = await currentResponse.json().catch(() => null) as CoderWorkspace | null;
  if (workspace?.id !== slot.workspace_id || workspace.name !== slot.workspace_name ||
      workspace.owner_id !== identity.id || workspace.owner_name !== identity.username) {
    throw new CostGateError('Coder workspace ownership does not match the private operator.');
  }

  const status = workspace.latest_build?.status || workspace.status || 'unknown';
  if (status === 'running') {
    // Link to Coder's authenticated workspace page. Coder itself exposes the
    // correct app URL for the active template, whether path or subdomain based.
    const url = `${publicCoderOrigin()}/@${encodeURIComponent(identity.username)}/${encodeURIComponent(workspace.name)}`;
    return NextResponse.json({ status: 'running', url, workspaceId: slot.workspace_id }, { headers: noStore });
  }
  if (['pending', 'starting', 'stopping', 'deleting', 'canceling'].includes(status)) {
    return NextResponse.json({ status, message: 'Coder is finishing a workspace transition.' }, { status: 202, headers: noStore });
  }
  if (status !== 'stopped') {
    return NextResponse.json({ error: `Coder reports workspace state ${status}. No new workspace was created.` }, { status: 409, headers: noStore });
  }
  if (!start) return NextResponse.json({ status: 'stopped' }, { headers: noStore });
  if (process.env.BILLABLE_OPERATIONS_ENABLED !== 'true') {
    throw new CostGateError('Workspace compute is paused by the operator.');
  }

  // Restart the SAME workspace ID and its existing volume. Never POST /workspaces.
  const started = await coderApiRequest(`${workspacePath}/builds`, 'POST', { transition: 'start' });
  if (!started.ok) throw new CostGateError('Coder did not accept the restart. No replacement workspace was created.');
  return NextResponse.json({ status: 'starting', message: 'Restarting your existing workspace.' }, { status: 202, headers: noStore });
}

async function handle(request: Request, { params }: Context, start: boolean) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  const { slotId } = await params;
  if (!slotIdPattern.test(slotId)) return NextResponse.json({ error: 'Invalid workspace allocation.' }, { status: 400, headers: noStore });
  try { return await openExistingWorkspace(user.id, slotId, start); }
  catch (cause) { return costGateResponse(cause instanceof CostGateError ? cause : undefined); }
}

export async function GET(request: Request, context: Context) { return handle(request, context, false); }
export async function POST(request: Request, context: Context) { return handle(request, context, true); }
