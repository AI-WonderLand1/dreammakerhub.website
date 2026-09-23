import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slotId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

/**
 * SECURITY HOLD
 *
 * Customer browsers must never receive the Coder dashboard origin. The current
 * Coder OIDC flow establishes a normal Coder browser session, which makes the
 * Coder dashboard reachable. Keep this route fail-closed until DreamMakerHub
 * has a workspace-only gateway that:
 *   - verifies the DreamMakerHub user and exact workspace ownership,
 *   - proxies the workspace app and WebSockets without an operator token,
 *   - exposes no direct Coder dashboard URL to the browser,
 *   - passes two-user cross-workspace negative tests.
 */
export async function GET(request: Request, { params }: Context) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  }

  const { slotId } = await params;
  if (!UUID.test(slotId)) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: noStore });
  }

  return NextResponse.json({
    error: 'Customer IDE opening is temporarily paused while the private DreamMakerHub IDE gateway is being secured.',
    code: 'CUSTOMER_IDE_GATEWAY_REQUIRED',
  }, { status: 503, headers: noStore });
}
