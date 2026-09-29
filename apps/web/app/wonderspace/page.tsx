import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceOperatorGate, { OperatorIdePanel } from '@/components/engines/WonderSpaceOperatorGate';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | DreamMakerHub',
  description: 'Browser project files and private VS Code workspaces managed through DreamMakerHub.',
};

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const isOperator = !error && isConfiguredCoderOperator(user?.id);

  // A verified operator keeps the existing private personal Coder workspace.
  // Other visitors pass through the client gate, which independently checks
  // Supabase Bearer authentication before choosing the customer view.
  if (isOperator) return <OperatorIdePanel />;
  return <WonderSpaceOperatorGate />;
}
