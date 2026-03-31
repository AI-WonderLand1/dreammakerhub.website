
import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's tickets
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      comments (
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, priority, category } = await request.json();
  
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ticket: data });
}
