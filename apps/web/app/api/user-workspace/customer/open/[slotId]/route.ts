import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { coderApiRequest } from '@/lib/coder/workspace-slots.server';
import {
  CUSTOMER_WORKSPACE_UUID,
  codeServerUrl,
  verifiedCustomerWorkspace,
  workspaceState,
} from '@/lib/coder/customer-workspace-access.server';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ slotId: string }> };

const noStore = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
};

async function handle(request: Request, { params }: Context, start: boolean) {
  const { slotId } = await params;
  if (!CUSTOMER_WORKSPACE_UUID.test(slotId)) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: noStore });
  }

  try {
    const user = await authenticatedSupabaseUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
    }

    const workspace = await verifiedCustomerWorkspace(request, slotId);
    const state = workspaceState(workspace);

    if (state === 'running') {
      const url = codeServerUrl(workspace);
      if (!url) {
        return NextResponse.json(
          { status: 'starting', message: 'The IDE app is still registering.' },
          { status: 202, headers: noStore },
        );
      }
      return NextResponse.json(
        { status: 'running', url, workspaceId: workspace.id },
        { headers: noStore },
      );
    }

    if (['pending', 'starting', 'stopping', 'deleting', 'canceling'].includes(state)) {
      return NextResponse.json(
        { status: state, message: 'Coder is finishing a workspace transition.' },
        { status: 202, headers: noStore },
      );
    }

    if (state !== 'stopped') {
      return NextResponse.json(
        { error: `Coder reports workspace state ${state}.` },
        { status: 409, headers: noStore },
      );
    }

    if (!start) {
      return NextResponse.json({ status: 'stopped' }, { headers: noStore });
    }

    const started = await coderApiRequest(
      `/api/v2/workspaces/${encodeURIComponent(workspace.id!)}/builds`,
      'POST',
      { transition: 'start' },
    );
    if (!started.ok && started.status !== 409) {
      throw new CostGateError('Coder did not accept the workspace restart.');
    }

    return NextResponse.json(
      { status: 'starting', message: 'Starting your existing private workspace.' },
      { status: 202, headers: noStore },
    );
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
