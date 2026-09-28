import 'server-only';
import { createClient } from '@/app/utils/supabase/server';

function controllerUrl() {
  if (process.env.WONDERSPACE_CUSTOMER_RUNTIME_ENABLED !== 'true') {
    throw new Error('Customer IDE provisioning has not been enabled.');
  }
  const raw = process.env.WONDERSPACE_CONTROLLER_URL;
  if (!raw) throw new Error('Customer IDE controller is not configured.');
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password ||
      !/^[a-z0-9-]+\.up\.railway\.app$/i.test(url.hostname) ||
      (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash || url.port) {
    throw new Error('Customer IDE controller URL is invalid.');
  }
  return url.origin;
}

/** Verify the exact Bearer session forwarded to the remote controller.
 * Never trust a user id or plan supplied by the browser. */
export async function verifiedCustomerToken(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match || match[1].length > 6000) return null;
  const supabase = await createClient();
  const result = await supabase.auth.getUser(match[1]);
  return !result.error && result.data.user ? match[1] : null;
}
export async function customerSandboxRequest(token: string, path: string, method: 'GET' | 'POST', body?: unknown) {
  const url = controllerUrl() + '/v1/workspaces' + path;
  const response = await fetch(url, {
    method, redirect: 'error', cache: 'no-store',
    headers: {
      Authorization: 'Bearer ' + token,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(method === 'POST' ? 110000 : 20000),
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  return { status: response.status, data };
}
export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;
