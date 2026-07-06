import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/utils/supabase/server';

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
