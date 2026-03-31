import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getSmokeUserIdFromRequest } from '@lib/smokeAuth';
import { runAI } from '../ai-router';

async function requireUser(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const smokeUserId = getSmokeUserIdFromRequest(req);

  if (!user && !smokeUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPaid = Boolean(user?.app_metadata?.plan === 'pro' || smokeUserId);
  if (process.env.WONDER_BUILD_REQUIRE_PAID === 'true' && !isPaid) {
    return NextResponse.json({ error: 'PAYWALL' }, { status: 402 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  const authResult = await requireUser(req);
  if (authResult) return authResult;

  const { source, targetLang } = await req.json();
  const result = await runAI(
    'code-convert',
    `Convert this code to ${targetLang}:\n\n${source}`
  );
  return NextResponse.json(result);
}
