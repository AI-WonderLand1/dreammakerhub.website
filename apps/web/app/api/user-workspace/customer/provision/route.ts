import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { queueCustomerWorkspace } from '@/lib/coder/customer-provisioning.server';
import { provisionCustomerWorkspaceNow } from '@/lib/coder/customer-workspace-create.server';
import { CoderOidcBootstrapRequired } from '@/lib/coder/customer-identity.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null);
  try {
    const slotId = await queueCustomerWorkspace(user, input);
    const status = await provisionCustomerWorkspaceNow(user.id, slotId);
    return NextResponse.json({ slotId, status, allocated: status === 'ready' }, {
      status: status === 'ready' ? 201 : 202,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (cause) {
    if (cause instanceof CoderOidcBootstrapRequired) {
      return NextResponse.json({
        error: cause.message,
        code: cause.code,
        href: cause.href,
      }, {
        status: 409,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
