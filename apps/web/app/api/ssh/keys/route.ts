// app/api/ssh/keys/route.ts
import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { public_key, name } = await request.json();
  
  // Store SSH key using your existing key management system
  const { data, error } = await supabase
    .from('ssh_keys')
    .insert({
      user_id: user.id,
      public_key,
      name,
      created_at: new Date().toISOString()
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
