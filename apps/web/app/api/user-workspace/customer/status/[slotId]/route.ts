import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { coderServiceClient } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slotId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: Context) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slotId } = await context.params;
  if (!UUID.test(slotId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const db = coderServiceClient();
    const slot = await db.from('coder_workspace_slots')
      .select('id,state,workspace_id').eq('id', slotId).eq('user_id', user.id).maybeSingle();
    if (slot.error || !slot.data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const job = await db.from('coder_customer_jobs').select('status')
      .eq('slot_id', slotId).eq('user_id', user.id).maybeSingle();
    if (job.error || !job.data) return NextResponse.json({ error: 'Status unavailable' }, { status: 503 });
    // Never return another customer's Coder owner, admin token or direct IDE URL.
    return NextResponse.json({ slotId, status: job.data.status, allocated: slot.data.state === 'provisioned' }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Status unavailable' }, { status: 503 });
  }
}
