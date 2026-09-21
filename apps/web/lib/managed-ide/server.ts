import 'server-only';
import { createHmac, randomUUID } from 'node:crypto';
import { getClient } from '@/lib/supabase-service';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import { verifiedCostPlan, CostGateError } from '@/lib/billing/cost-guard.server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

function enabled(): void {
  if (process.env.MANAGED_IDE_ENABLED !== 'true' || process.env.BILLABLE_OPERATIONS_ENABLED !== 'true') {
    throw new CostGateError('Managed IDE provisioning is not enabled.');
  }
}
function config() {
  const origin = process.env.MANAGED_IDE_AGENT_ORIGIN;
  const secret = process.env.IDE_AGENT_SECRET;
  if (!origin || !secret || Buffer.byteLength(secret) < 32) {
    throw new CostGateError('Managed IDE agent is not configured.');
  }
  const url = new URL(origin);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname.endsWith('.svc.cluster.local')))) {
    throw new CostGateError('Managed IDE agent must use HTTPS or an internal Kubernetes endpoint.');
  }
  return { origin: url.origin, secret };
}
function signed(value: unknown): string {
  const { secret } = config();
  const encoded = Buffer.from(JSON.stringify(value)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}
export function ideTicketUrl(userId: string, workspaceId: string): string {
  if (!UUID.test(userId) || !UUID.test(workspaceId)) throw new CostGateError('Invalid IDE identity.');
  const url = new URL(process.env.MANAGED_IDE_PUBLIC_ORIGIN || '');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new CostGateError('The public IDE HTTPS origin is not configured.');
  }
  const ticket = signed({ kind: 'ticket', uid: userId, id: workspaceId,
    exp: Math.floor(Date.now() / 1000) + 60, nonce: randomUUID() });
  return `${url.origin}/connect?ticket=${encodeURIComponent(ticket)}`;
}
function service() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new CostGateError('Managed IDE accounting is not configured.');
  }
  return getClient();
}
export async function managedIdeOptions() {
  enabled();
  config();
  const url = process.env.MANAGED_IDE_PUBLIC_ORIGIN;
  if (!url || new URL(url).protocol !== 'https:') throw new CostGateError('Managed IDE public URL is not configured.');
  return {
    templateId: 'managed-linux', templateName: 'Linux IDE',
    cpu: [{ label: '2 vCPU', value: '2' }], memory: [{ label: '4 GiB', value: '4' }],
    regions: [], repositorySupported: false, sshSupported: false, diskSupported: true,
    diskGiB: 10, projects: [], ideImages: [{ id: 'linux', name: 'Linux IDE' }],
  };
}
export async function managedIdeWorkspaces(userId: string) {
  enabled();
  if (!UUID.test(userId)) throw new CostGateError('Invalid IDE identity.');
  const { data, error } = await service().from('managed_ide_workspaces')
    .select('id,name,image_key,state,created_at').eq('user_id', userId)
    .neq('state', 'deleted').order('created_at', { ascending: false });
  if (error) throw new CostGateError('Could not load managed IDE workspaces.');
  return (data || []).map(workspace => ({
    id: workspace.id, name: workspace.name, image: workspace.image_key,
    status: workspace.state, ideUrl: ideTicketUrl(userId, workspace.id),
  }));
}
export async function provisionManagedIde(userId: string, name: string, imageKey: string) {
  enabled();
  if (!UUID.test(userId) || !NAME.test(name) || imageKey !== 'linux') {
    throw new CostGateError('Choose a valid name and an approved IDE image.', 400);
  }
  if (process.env.IDE_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('New IDE workspaces are paused pending capacity checks.');
  }
  const plan = await verifiedCostPlan(userId);
  if (plan === 'free') throw new CostGateError('Cloud IDE requires an active paid subscription.', 402);
  const limit = PLAN_LIMITS[plan].workspacesLimit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) throw new CostGateError('Workspace allowance is unavailable.');
  const { origin, secret } = config();
  const { data: id, error } = await service().rpc('reserve_managed_ide_workspace', {
    p_user_id: userId, p_name: name, p_image_key: imageKey, p_limit: limit,
  });
  if (error || typeof id !== 'string' || !UUID.test(id)) {
    throw new CostGateError('Workspace allowance reached or workspace database is unavailable.', 429);
  }
  const payload = JSON.stringify({ id, userId, imageKey });
  const timestamp = Date.now();
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('base64url');
  let response: Response;
  try {
    response = await fetch(`${origin}/internal/provision`, {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        'X-Ide-Timestamp': String(timestamp), 'X-Ide-Signature': signature },
      body: payload, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
  } catch { throw new CostGateError('The IDE agent did not respond. Your reserved workspace can be retried.'); }
  if (!response.ok) throw new CostGateError('The IDE agent could not provision your workspace. Your reservation is retained for a safe retry.');
  const result = await response.json().catch(() => null);
  if (result?.id !== id) throw new CostGateError('IDE agent returned an unexpected workspace ID.');
  const { error: updateError } = await service().from('managed_ide_workspaces')
    .update({ state: 'provisioning', updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', userId).in('state', ['reserved', 'provisioning']);
  if (updateError) throw new CostGateError('IDE was provisioned but workspace tracking requires attention.');
  return { workspace: { id, name, status: 'provisioning' },
    ideUrl: ideTicketUrl(userId, id), podType: 'ide', storageGiB: 10 };
}
