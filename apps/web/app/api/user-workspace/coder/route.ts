import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { CostGateError, costGateResponse } from '@/lib/billing/cost-guard.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { assertFreshUsageController, customerProvisioningGate, verifiedCustomerTemplateId } from '@/lib/coder/customer-provisioning.server';
import { listCoderSlots } from '@/lib/coder/workspace-slots.server';

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
        await assertFreshUsageController();
        canOpen = true;
      } catch {
        canOpen = false;
      }
    }
    return NextResponse.json({
      slots,
      canOpen,
      openMode: canOpen ? (operator ? 'operator' : 'customer') : 'disabled',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (cause) {
    return costGateResponse(cause instanceof CostGateError ? cause : undefined);
  }
}
