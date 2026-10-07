import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { customerProvisioningGate, verifiedCustomerTemplateId } from '@/lib/coder/customer-provisioning.server';
import { coderServiceClient, listCoderSlots } from '@/lib/coder/workspace-slots.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const slots = await listCoderSlots(user.id);
    const operator = isConfiguredCoderOperator(user.id);
    // Only the operator can use the old shared-token start/open endpoint.
    // Customers get a separate, read-only handoff that rechecks ownership.
    let canOpen = operator;
    if (!operator) {
      try {
        customerProvisioningGate();
        await verifiedCustomerTemplateId();
        canOpen = true;
      } catch {
        canOpen = false;
      }
    }
    const db = coderServiceClient();
    const jobs = await db.from('coder_customer_jobs')
      .select('slot_id,machine_profile')
      .eq('user_id', user.id);
    const profiles = new Map(
      Array.isArray(jobs.data)
        ? jobs.data.map((job) => [job.slot_id, job.machine_profile])
        : [],
    );
    return NextResponse.json({
      slots: slots.map((slot) => ({
        ...slot,
        machine_profile: profiles.get(slot.id) || null,
      })),
      canOpen,
      openMode: canOpen ? (operator ? 'operator' : 'customer') : 'disabled',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
