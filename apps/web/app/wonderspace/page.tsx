import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceOperatorGate, { OperatorIdePanel } from '@/components/engines/WonderSpaceOperatorGate';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Browser editor and separately isolated Railway Sandbox development environments.',
};

/**
 * The customer pathway is Railway Sandboxes, not AWS, EKS or the operator's
 * shared Coder service. Both server authorization and public UI release must
 * be enabled following the isolated, billable two-user smoke test.
 * API/controller enforce their own independent owner and cost checks.
 */
function railwayCustomerPilot(): boolean {
  return process.env.WONDERSPACE_CUSTOMER_RUNTIME_ENABLED === 'true' &&
    process.env.NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED === 'true' &&
    Boolean(process.env.WONDERSPACE_CONTROLLER_URL);
}

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const isOperator = !error && isConfiguredCoderOperator(user?.id);

  // If the SSR cookie is missing, do not guess that the visitor is a customer.
  // The browser can have a verified Supabase session even when the proxy drops
  // SSR cookies. The client gate rechecks the role using a verified Bearer token.
  if (isOperator) {
    const customerPilot = railwayCustomerPilot();
    return <OperatorIdePanel customerPilot={customerPilot} />;
  }

  // No customer Coder/EKS form: the customer pilot uses isolated Railway
  // Sandboxes and stays invisible until its own runtime/controller gates pass.
  const customerPilot = railwayCustomerPilot();
  return <WonderSpaceOperatorGate customerPilot={customerPilot} />;
}
