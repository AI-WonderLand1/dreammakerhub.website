import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customerLaunchEnabled =
    process.env.BILLABLE_OPERATIONS_ENABLED === 'true' &&
    process.env.CODER_WORKSPACE_CREATION_ENABLED === 'true' &&
    process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true' &&
    process.env.CODER_CUSTOMER_TEMPLATE_SECURITY_VERIFIED === 'true' &&
    process.env.CODER_CUSTOMER_HARD_STOP_VERIFIED === 'true' &&
    process.env.CODER_SUPABASE_OIDC_VERIFIED === 'true' &&
    process.env.CODER_CUSTOMER_DIRECT_ACCESS_VERIFIED === 'true';

  if (!customerLaunchEnabled) {
    return NextResponse.json({
      error: 'Customer IDE access is paused until billing, identity, template isolation, and hard-stop safeguards are verified.',
      code: 'CUSTOMER_IDE_PAUSED',
    }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }

  try {
    const config = await getCoderLaunchConfig();
    return NextResponse.json({ ...config, projects: [] }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({
      error: 'Coder is configured, but launch options could not be verified.',
      code: 'CODER_OPTIONS_UNAVAILABLE',
    }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
