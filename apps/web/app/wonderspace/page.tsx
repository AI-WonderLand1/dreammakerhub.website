import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceOperatorGate, { OperatorIdePanel } from '@/components/engines/WonderSpaceOperatorGate';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private Coder cloud development workspace.',
};

/**
 * UI readiness is not provisioning authorization: the API separately checks
 * owner identity, the pinned template, and a fresh usage controller heartbeat.
 * Do not present the customer creation wizard when known hard gates are off.
 */
function customerCreationUiReady(): boolean {
  const flags = [
    'CODER_CUSTOMER_PROVISIONING_ENABLED',
    'CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED',
    'CODER_CUSTOMER_HARD_STOP_VERIFIED',
    'CODER_SUPABASE_OIDC_VERIFIED',
    'BILLABLE_OPERATIONS_ENABLED',
    'CODER_WORKSPACE_CREATION_ENABLED',
  ] as const;
  return flags.every(name => process.env[name] === 'true') &&
    [
      'CODER_CUSTOMER_TEMPLATE_ID',
      'CODER_CUSTOMER_TEMPLATE_VERSION_ID',
      'CODER_CUSTOMER_TEMPLATE_NAME',
      'CODER_OPERATOR_TEMPLATE_ID',
      'CODER_OPERATOR_USER_ID',
      'CODER_FREE_COMPUTE_MINUTES',
      'CODER_CUSTOMER_RUNNER_SECRET',
      'CODER_API_URL',
      'CODER_API_TOKEN',
    ].every(name => Boolean(process.env[name]));
}

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const isOperator = !error && isConfiguredCoderOperator(user?.id);

  // If the SSR cookie is missing, do not guess that the visitor is a customer.
  // The browser can have a verified Supabase session even when the proxy drops
  // SSR cookies. The client gate rechecks the role using a verified Bearer token.
  if (isOperator) {
    const customerPilot = customerCreationUiReady();
    return <OperatorIdePanel customerPilot={customerPilot} />;
  }

  // Customer pod provisioning and browser IDE opening are deliberately
  // independent. A private pod/PVC may be prepared while the direct-open route
  // remains fail-closed until the DreamMakerHub-only gateway is verified.
  const customerPilot = customerCreationUiReady();
  return <WonderSpaceOperatorGate customerPilot={customerPilot} />;
}
