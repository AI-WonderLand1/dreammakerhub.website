import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const formData = await request.formData();
  const authorizationId = formData.get('authorization_id');
  const decision = formData.get('decision');

  if (typeof authorizationId !== 'string' || !authorizationId || authorizationId.length > 2048 ||
      (decision !== 'approve' && decision !== 'deny')) {
    return NextResponse.json({ error: 'Invalid OAuth decision.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    const returnTo = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    return NextResponse.redirect(
      new URL(`/public-pages/auth?redirectTo=${encodeURIComponent(returnTo)}`, request.url),
      { status: 303 },
    );
  }

  const result = decision === 'approve'
    ? await supabase.auth.oauth.approveAuthorization(authorizationId)
    : await supabase.auth.oauth.denyAuthorization(authorizationId);

  if (result.error || !result.data?.redirect_url) {
    return NextResponse.json(
      { error: result.error?.message || 'OAuth authorization could not be completed.' },
      { status: 400 },
    );
  }

  return NextResponse.redirect(result.data.redirect_url, { status: 303 });
}
