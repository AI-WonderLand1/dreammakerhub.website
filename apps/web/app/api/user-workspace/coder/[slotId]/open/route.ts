import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { verifiedCustomerCoderOwner } from '@/lib/coder/customer-identity.server';
import { verifiedCustomerTemplate } from '@/lib/coder/customer-provisioning.server';
import {
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
  template_id?: string;
  status?: string;
  latest_build?: { status?: string; transition?: string };
};

const noStore = { 'Cache-Control': 'private, no-store' };
const slotIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function publicCoderOrigin(): string {
  const configured = process.env.CODER_ACCESS_URL || process.env.NEXT_PUBLIC_CODER_ACCESS_URL;
  if (!configured) throw new CostGateError('The public Coder address is not configured.');

  let url: URL;
  try { url = new URL(configured); }
  catch { throw new CostGateError('The public Coder address is invalid.'); }

  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new CostGateError('The public Coder address must be an HTTPS origin.');
  }
  return url.origin;
}

async function openExistingWorkspace(request: Request, slotId: string, start: boolean) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });

  const slot = await getCoderSlot(user.id, slotId);
  if (!slot) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404, headers: noStore });

  if (slot.state !== 'provisioned' || !slot.workspace_id) {
    return NextResponse.json(
      { error: 'Workspace allocation is not ready. No new workspace was created.' },
      { status: 409, headers: noStore },
    );
  }

  if (slot.coder_api_origin !== coderApiConfig().url) {
    throw new CostGateError('This workspace belongs to a different Coder deployment.');
  }

  const operator = isConfiguredCoderOperator(user.id);
  let expectedOwnerId: string;
  let expectedTemplateId: string | null = null;

  if (operator) {
    const identityResponse = await coderApiRequest('/api/v2/users/me', 'GET');
    const identity = identityResponse.ok
      ? await identityResponse.json().catch(() => null) as CoderIdentity | null
      : null;
    if (!identity?.id || !identity.username) {
      throw new CostGateError('Coder could not verify the operator account.');
    }
    expectedOwnerId = identity.id;
  } else {
    expectedOwnerId = await verifiedCustomerCoderOwner(user);
    expectedTemplateId = (await verifiedCustomerTemplate()).id;
  }

  const workspacePath = `/api/v2/workspaces/${encodeURIComponent(slot.workspace_id)}`;
  const currentResponse = await coderApiRequest(workspacePath, 'GET');
  if (!currentResponse.ok) {
    throw new CostGateError('Coder could not verify the existing workspace. No replacement workspace was created.');
  }

  const workspace = await currentResponse.json().catch(() => null) as CoderWorkspace | null;
  if (!workspace?.id ||
      workspace.id !== slot.workspace_id ||
      workspace.name !== slot.workspace_name ||
      workspace.owner_id !== expectedOwnerId ||
      (expectedTemplateId && workspace.template_id !== expectedTemplateId) ||
      !workspace.owner_name) {
    throw new CostGateError('Coder workspace ownership does not match the authenticated DreamMakerHub account.');
  }

  const status = workspace.latest_build?.status || workspace.status || 'unknown';

  if (status === 'running') {
    const url = `${publicCoderOrigin()}/@${encodeURIComponent(workspace.owner_name)}/${encodeURIComponent(workspace.name)}`;
    return NextResponse.json(
      { status: 'running', url, workspaceId: slot.workspace_id },
      { headers: noStore },
    );
  }

  if (['pending', 'starting', 'stopping', 'deleting', 'canceling'].includes(status)) {
    return NextResponse.json(
      { status, message: 'Coder is finishing a workspace transition.' },
      { status: 202, headers: noStore },
    );
  }

  if (status !== 'stopped') {
    return NextResponse.json(
      { error: `Coder reports workspace state ${status}. No replacement workspace was created.` },
      { status: 409, headers: noStore },
    );
  }

  if (!start) return NextResponse.json({ status: 'stopped' }, { headers: noStore });

  if (process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('Workspace compute is disabled by the operator.');
  }

  const started = await coderApiRequest(
    `${workspacePath}/builds`,
    'POST',
    { transition: 'start' },
  );

  if (!started.ok) {
    throw new CostGateError('Coder did not accept the restart. No replacement workspace was created.');
  }

  return NextResponse.json(
    { status: 'starting', message: 'Restarting your existing Coder workspace.' },
    { status: 202, headers: noStore },
  );
}

async function handle(request: Request, { params }: Context, start: boolean) {
  const { slotId } = await params;
  if (!slotIdPattern.test(slotId)) {
    return NextResponse.json({ error: 'Invalid workspace allocation.' }, { status: 400, headers: noStore });
  }

  try {
    return await openExistingWorkspace(request, slotId, start);
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}

export async function GET(request: Request, context: Context) {
  return handle(request, context, false);
}

export async function POST(request: Request, context: Context) {
  return handle(request, context, true);
}
