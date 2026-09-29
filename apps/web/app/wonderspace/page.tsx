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
async function railwayCustomerPilot(): Promise<boolean> {
  if (process.env.WONDERSPACE_CUSTOMER_RUNTIME_ENABLED !== 'true' ||
      process.env.NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED !== 'true') return false;
  const configured = process.env.WONDERSPACE_CONTROLLER_URL;
  if (!configured) return false;
  try {
    const endpoint = new URL(configured);
    // Never let an operator-supplied or compromised env URL trigger SSRF.
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password ||
        !/^[a-z0-9-]+\.up\.railway\.app$/i.test(endpoint.hostname) ||
        (endpoint.pathname !== '/' && endpoint.pathname !== '') ||
        endpoint.search || endpoint.hash || endpoint.port) return false;
    // A visible Create button requires a deployed responding controller,
    // not merely an environment variable. This is UI readiness only.
    const response = await fetch(endpoint.origin + '/healthz', {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(2500),
    });
    const status = response.ok ? await response.json().catch(() => null) : null;
    return status?.ok === true && status?.runtimeEnabled === true;
  } catch {
    return false;
  }
}

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const isOperator = !error && isConfiguredCoderOperator(user?.id);

  // If the SSR cookie is missing, do not guess that the visitor is a customer.
  // The browser can have a verified Supabase session even when the proxy drops
  // SSR cookies. The client gate rechecks the role using a verified Bearer token.
  if (isOperator) return <OperatorIdePanel />;

  // No customer Coder/EKS form: the customer pilot uses isolated Railway
  // Sandboxes and stays invisible until its own runtime/controller gates pass.
  const customerPilot = await railwayCustomerPilot();
  return <WonderSpaceOperatorGate customerPilot={customerPilot} />;
}
