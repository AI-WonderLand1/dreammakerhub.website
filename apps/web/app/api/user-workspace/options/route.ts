import { NextResponse } from 'next/server';
import { authenticatedSupabaseUser } from '@/lib/supabase/authenticated-user.server';
import { getCoderLaunchConfig } from '@/lib/coder/launch-options';
import {
  customerProvisioningGate,
  verifiedCustomerTemplate,
} from '@/lib/coder/customer-provisioning.server';
import { coderOidcEnabled } from '@/lib/coder/customer-identity.server';

export const dynamic = 'force-dynamic';

type Blocker = {
  code: string;
  message: string;
  action?: string;
  href?: string;
};

export async function GET(request: Request) {
  const user = await authenticatedSupabaseUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blockers: Blocker[] = [];

  try {
    customerProvisioningGate();
  } catch (cause) {
    blockers.push({
      code: 'OPERATOR_SWITCH',
      message: cause instanceof Error ? cause.message : 'Customer workspace creation is disabled.',
      action: 'The AI WONDERLAND operator must enable customer workspace creation.',
    });
  }

  let config;
  try {
    config = await getCoderLaunchConfig();
    await verifiedCustomerTemplate();
  } catch (cause) {
    return NextResponse.json({
      error: cause instanceof Error ? cause.message : 'Coder launch options unavailable.',
      code: 'CODER_TEMPLATE_UNAVAILABLE',
      ready: false,
      blockers,
    }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const oidc = await coderOidcEnabled().catch(() => false);
  if (!oidc) {
    blockers.push({
      code: 'CODER_OIDC_REQUIRED',
      message: 'Coder customer single sign-on is not enabled yet.',
      action: 'Enable the Supabase OIDC provider in Coder before customer rollout.',
    });
  }


  if (!process.env.CODER_OPERATOR_USER_ID) {
    blockers.push({
      code: 'OPERATOR_ID_REQUIRED',
      message: 'The Coder operator identity is not pinned.',
      action: 'Configure CODER_OPERATOR_USER_ID before customer creation.',
    });
  }

  return NextResponse.json({
    ...config,
    ready: blockers.length === 0,
    oidcEnabled: oidc,
    blockers,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
