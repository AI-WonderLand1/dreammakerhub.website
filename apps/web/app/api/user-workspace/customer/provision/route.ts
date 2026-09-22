import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { queueCustomerWorkspace } from '@/lib/coder/customer-provisioning.server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
