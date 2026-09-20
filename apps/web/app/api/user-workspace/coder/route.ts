import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { listCoderSlots } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const slots = await listCoderSlots(user.id);
    return NextResponse.json({ slots }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
