import 'server-only';
import { fetch as undiciFetch } from 'undici';
import { getClient } from '@/lib/supabase-service';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import { CostGateError, verifiedCostPlan } from '@/lib/billing/cost-guard.server';
import { isConfiguredCoderOperator } from '@/lib/coder/operator-access.server';
import { secureCoderApiOrigin } from '@/lib/coder/secure-origin';

export const MAX_CODER_CPU = 2;
export const MAX_CODER_MEMORY_GIB = 4;
export const CODER_DISK_GIB = 10;
// Coder TTL is an inactivity-based autostop request, NOT cumulative IDE time.
export const CODER_TTL_MS = 60 * 60 * 1000;

type CoderSlotPublic = {
  id: string;
  workspace_id: string | null;
  workspace_name: string;
  state: 'reserved' | 'provisioned' | 'deleting' | 'released';
  created_at: string;
};
export type CoderSlot = CoderSlotPublic & { coder_api_origin: string };

export function coderServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new CostGateError('Workspace accounting is not configured. New pods are paused.');
  }
  return getClient();
}

export function assertCoderResourceBudget(cpu: number, memory: number): void {
  if (!Number.isInteger(cpu) || cpu < 1 || cpu > MAX_CODER_CPU ||
      !Number.isInteger(memory) || memory < 1 || memory > MAX_CODER_MEMORY_GIB) {
    throw new CostGateError('Workspace size exceeds the 2 CPU / 4 GiB safety ceiling.', 429);
  }
}

export function coderApiConfig(): { url: string; token: string } {
  const url = process.env.CODER_API_URL;
  const token = process.env.CODER_API_TOKEN;
  if (!url || !token) throw new CostGateError('Coder connection is not configured.');
  try { return { url: secureCoderApiOrigin(url), token }; }
  catch { throw new CostGateError('Coder API requires HTTPS or an internal private endpoint.'); }
}

/**
 * Supabase auth.users.id identifies a customer but does not authenticate them
 * to Coder. The current backend token creates workspaces under ONE Coder owner.
 * Until a verified per-customer Coder identity and a hard usage limit exist,
 * only the explicitly allowlisted site operator may use this creation path.
 * This independent gate prevents a billing flag from exposing the operator IDE.
 */
export function assertCoderOwnerIsolation(userId: string): void {
  if (!isConfiguredCoderOperator(userId)) {
    throw new CostGateError('Customer IDE creation is paused until individual Coder access and time limits are verified.');
  }
}

export async function reserveCoderSlot(userId: string, workspaceName: string): Promise<string> {
  assertCoderOwnerIsolation(userId);
  // Do not call Coder at all if either operator switch is off.
  if (process.env.BILLABLE_OPERATIONS_ENABLED !== 'true' ||
      process.env.CODER_WORKSPACE_CREATION_ENABLED !== 'true') {
    throw new CostGateError('New cloud workspaces are paused pending cost-control verification.');
  }
  const plan = await verifiedCostPlan(userId);
  if (plan === 'free') throw new CostGateError('Cloud IDE requires an active paid subscription.', 402);
  const limit = PLAN_LIMITS[plan].workspacesLimit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) {
    throw new CostGateError('Workspace allowance is not configured. New pods are paused.');
  }
  const { data, error } = await coderServiceClient().rpc('reserve_coder_workspace_slot', {
    p_user_id: userId,
    p_workspace_name: workspaceName,
    p_origin: coderApiConfig().url,
    p_limit: limit,
  });
  if (error) throw new CostGateError('Workspace accounting is unavailable. No pod was requested.');
  if (typeof data !== 'string' || !/^[a-f0-9-]{36}$/i.test(data)) {
    throw new CostGateError(`Workspace allowance reached (${limit} allocated workspace${limit === 1 ? '' : 's'}) or name already taken. Delete an unused workspace to free a slot.`, 429);
  }
  return data;
}

export async function attachCoderWorkspace(userId: string, slotId: string, workspaceId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(workspaceId)) {
    throw new CostGateError('Coder returned an invalid workspace ID. The slot remains reserved for manual reconciliation.');
  }
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .update({ workspace_id: workspaceId, state: 'provisioned', updated_at: new Date().toISOString() })
    .eq('id', slotId).eq('user_id', userId).eq('state', 'reserved')
    .select('id').maybeSingle();
  if (error || !data) {
    throw new CostGateError('Coder created a workspace but tracking failed. The slot remains held to prevent duplicate charges. Contact support.');
  }
}

export async function listCoderSlots(userId: string): Promise<CoderSlotPublic[]> {
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .select('id,workspace_id,workspace_name,state,created_at')
    .eq('user_id', userId).is('released_at', null).order('created_at', { ascending: true });
  if (error || !Array.isArray(data)) {
    // Only log the database error code. Do not log IDs, tokens, or row contents.
    console.error('[coder-workspaces] allocation read failed', { code: error?.code || 'invalid_response' });
    throw new CostGateError('Workspace allocation lookup failed. No workspaces were changed.');
  }
  return data as CoderSlotPublic[];
}

export async function getCoderSlot(userId: string, slotId: string): Promise<CoderSlot | null> {
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .select('id,workspace_id,workspace_name,coder_api_origin,state,created_at')
    .eq('user_id', userId).eq('id', slotId).is('released_at', null).maybeSingle();
  if (error) throw new CostGateError('Workspace allocation lookup failed.');
  return (data as CoderSlot | null) ?? null;
}

export async function markCoderSlotDeleting(userId: string, slotId: string): Promise<void> {
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .update({ state: 'deleting', updated_at: new Date().toISOString() })
    .eq('user_id', userId).eq('id', slotId).in('state', ['provisioned', 'deleting'])
    .select('id').maybeSingle();
  if (error || !data) throw new CostGateError('Could not secure workspace deletion. Slot remains allocated.');
}

export async function releaseDeletedCoderSlot(userId: string, slotId: string, workspaceId: string): Promise<void> {
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .update({ state: 'released', released_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', userId).eq('id', slotId).eq('workspace_id', workspaceId).eq('state', 'deleting')
    .select('id').maybeSingle();
  if (error || !data) throw new CostGateError('Coder deleted the workspace, but the allocation is still held. Contact support.');
}

export async function coderApiRequest(path: string, method: 'GET' | 'POST', body?: unknown): Promise<Response> {
  const { url, token } = coderApiConfig();
  try {
    return await undiciFetch(`${url}${path}`, {
      method,
      headers: { 'Coder-Session-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
      cache: 'no-store',
    });
  } catch {
    throw new CostGateError('Coder connection failed. Allocation remains reserved.');
  }
}
