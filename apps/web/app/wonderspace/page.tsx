import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceOperatorGate, { OperatorIdePanel } from '@/components/engines/WonderSpaceOperatorGate';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private Coder cloud development workspace.',
};

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const isOperator = !error && Boolean(user && adminIds.includes(user.id));

  // If the SSR cookie is missing, do not guess that the visitor is a customer.
  // The browser can have a verified Supabase session even when the proxy drops
  // SSR cookies. The client gate rechecks the role using a verified Bearer token.
  if (isOperator) return <OperatorIdePanel />;

  const customerPilot = process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true';
  return <WonderSpaceOperatorGate customerPilot={customerPilot} />;
}
