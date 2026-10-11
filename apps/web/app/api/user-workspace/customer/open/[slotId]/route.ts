import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { coderApiRequest, coderServiceClient } from '@/lib/coder/workspace-slots.server';
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

    // Never restart a customer workspace without a registered usage allowance.
    // The legacy runtime controller is disabled: fail closed for restarts rather
    // than interpreting missing metering data as unlimited free compute.
    const accounting = coderServiceClient();
    const { data: usage, error: usageError } = await accounting
      .from('coder_customer_compute_usage')
      .select('used_ms,max_ms')
      .eq('user_id', user.id)
      .eq('workspace_id', workspace.id!)
      .maybeSingle();
    if (usageError || !usage ||
      typeof usage.used_ms !== 'number' || typeof usage.max_ms !== 'number' ||
      usage.max_ms <= 0) {
      throw new CostGateError('IDE runtime allowance cannot be verified. Workspace restart is paused.');
    }
    if (usage.used_ms >= usage.max_ms) {
      throw new CostGateError('IDE runtime allowance exhausted. Workspace restart is paused.', 429);
    }
    const monthStart = new Date();
    const periodStart = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const { data: monthly, error: monthlyError } = await accounting
      .from('coder_customer_compute_monthly')
      .select('used_weighted_ms,limit_credits')
      .eq('user_id', user.id)
      .eq('period_start', periodStart)
      .maybeSingle();
    if (monthlyError || !monthly ||
      typeof monthly.used_weighted_ms !== 'number' ||
      typeof monthly.limit_credits !== 'number' ||
      monthly.limit_credits <= 0) {
      throw new CostGateError('Monthly IDE budget cannot be verified. Workspace restart is paused.');
    }
    if (monthly.used_weighted_ms >= monthly.limit_credits * 60_000) {
      throw new CostGateError('Monthly IDE compute allowance exhausted. Workspace restart is paused.', 429);
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
