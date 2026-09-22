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
    // The server token currently represents ONE Coder user, not the customer.
    // Never advertise a customer-open action until separate identities exist.
    const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
    const operatorId = process.env.CODER_OPERATOR_SUPABASE_ID?.trim();
    const canOpen = adminIds.includes(user.id) &&
      (operatorId ? operatorId === user.id : adminIds.length === 1 && adminIds[0] === user.id);
    return NextResponse.json({ slots, canOpen }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
