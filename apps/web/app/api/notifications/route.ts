// app/api/notifications/route.ts
import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, type, target_id } = await request.json();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      message,
      type,
      target_id,
      read: false,
      created_at: new Date().toISOString()
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
