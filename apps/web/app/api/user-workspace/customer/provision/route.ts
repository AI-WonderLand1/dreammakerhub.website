import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { queueCustomerWorkspace } from '@/lib/coder/customer-provisioning.server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const input = await request.json().catch(() => null);
  try {
    const slotId = await queueCustomerWorkspace(user, input);
    return NextResponse.json({ slotId, status: 'queued' }, {
      status: 202, headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
