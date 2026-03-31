// app/api/support/comments/route.ts
import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ticket_id, content } = await request.json();
  
  const { data, error } = await supabase
    .from('support_comments')
    .insert({
      ticket_id,
      user_id: user.id,
      content,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify assignee if this is a customer comment
  if (user.id !== data.assignee_id) {
    await supabase
      .from('notifications')
      .insert({
        user_id: data.assignee_id,
        message: `New comment on ticket: ${data.content.substring(0, 50)}...`,
        type: 'support_comment',
        target_id: ticket_id
      });
  }

  return NextResponse.json({ success: true, comment: data });
}
