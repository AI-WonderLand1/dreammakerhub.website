import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceOperatorGate, { OperatorIdePanel } from '@/components/engines/WonderSpaceOperatorGate';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private Coder cloud development workspace.',
};

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const isOperator = !error && isConfiguredCoderOperator(user?.id);

  // If the SSR cookie is missing, do not guess that the visitor is a customer.
  // The browser can have a verified Supabase session even when the proxy drops
  // SSR cookies. The client gate rechecks the role using a verified Bearer token.
  if (isOperator) {
    const customerPilot = process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true';
    return <OperatorIdePanel customerPilot={customerPilot} />;
  }

  // Customer pod provisioning and browser IDE opening are deliberately
  // independent. A private pod/PVC may be prepared while the direct-open route
  // remains fail-closed until the DreamMakerHub-only gateway is verified.
  const customerPilot = process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true';
  return <WonderSpaceOperatorGate customerPilot={customerPilot} />;
}
