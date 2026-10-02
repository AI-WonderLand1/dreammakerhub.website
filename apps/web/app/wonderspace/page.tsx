import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceOperatorGate, { OperatorIdePanel } from '@/components/engines/WonderSpaceOperatorGate';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { normalizeWonderSpaceProjectId, wonderSpaceProjectHub } from '@/lib/wonderspace/routes';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI WONDERLAND',
  description: 'Browser project files and private VS Code workspaces managed through AI WONDERLAND.',
};

export default async function WonderSpacePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const params = await searchParams;
  const projectId = normalizeWonderSpaceProjectId(params.projectId);
  if (projectId) redirect(wonderSpaceProjectHub(projectId));

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const isOperator = !error && isConfiguredCoderOperator(user?.id);

  // A verified operator keeps the existing private personal Coder workspace.
  // Other visitors pass through the client gate, which independently checks
  // Supabase Bearer authentication before choosing the customer view.
  if (isOperator) return <OperatorIdePanel />;
  return <WonderSpaceOperatorGate />;
}
