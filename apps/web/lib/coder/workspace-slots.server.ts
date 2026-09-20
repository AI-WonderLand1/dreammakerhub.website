import 'server-only';
import { getClient } from '@/lib/supabase-service';
import { PLAN_LIMITS } from '@/lib/billing/limits';
import { CostGateError, verifiedCostPlan } from '@/lib/billing/cost-guard.server';

export const MAX_CODER_CPU = 2;
export const MAX_CODER_MEMORY_GIB = 4;
export const CODER_DISK_GIB = 10;
export const CODER_TTL_MS = 60 * 60 * 1000;

export type CoderSlot = {
  id: string;
  workspace_id: string | null;
  workspace_name: string;
  state: 'reserved' | 'provisioned' | 'deleting' | 'released';
  created_at: string;
};

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

export async function reserveCoderSlot(userId: string, workspaceName: string): Promise<string> {
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

export async function listCoderSlots(userId: string): Promise<CoderSlot[]> {
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .select('id,workspace_id,workspace_name,state,created_at')
    .eq('user_id', userId).is('released_at', null).order('created_at', { ascending: true });
  if (error || !Array.isArray(data)) throw new CostGateError('Workspace allocation records are unavailable.');
  return data as CoderSlot[];
}

export async function getCoderSlot(userId: string, slotId: string): Promise<CoderSlot | null> {
  const { data, error } = await coderServiceClient().from('coder_workspace_slots')
    .select('id,workspace_id,workspace_name,state,created_at')
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

export function coderApiConfig(): { url: string; token: string } {
  const url = process.env.CODER_API_URL;
  const token = process.env.CODER_API_TOKEN;
  if (!url || !token) throw new CostGateError('Coder connection is not configured.');
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new CostGateError('Coder API URL is invalid.'); }
  // An HTTP URL is acceptable only for an operator-managed internal host, never a browser URL.
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.search || parsed.hash || parsed.pathname.replace(/\/$/, '') !== '') {
    throw new CostGateError('Coder API URL must be a server origin without credentials or a path.');
  }
  return { url: parsed.origin, token };
}

export async function coderApiRequest(path: string, method: 'GET' | 'POST', body?: unknown): Promise<Response> {
  const { url, token } = coderApiConfig();
  try {
    return await fetch(`${url}${path}`, {
      method,
      headers: { 'Coder-Session-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
  } catch {
    throw new CostGateError('Coder connection failed. Allocation remains reserved.');
  }
}
