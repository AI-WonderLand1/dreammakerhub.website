'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

const channels = new Map<string, Promise<RealtimeChannel>>();

async function getChannel(room: string): Promise<RealtimeChannel> {
  let p = channels.get(room);
  if (!p) {
    p = (async () => {
      const sb = getSupabaseClient();
      if (!sb) throw new Error('Supabase not configured');
      const ch = sb.channel(room, { config: { broadcast: { self: false, ack: false } } });
      await ch.subscribe();
      return ch;
    })();
    channels.set(room, p);
  }
  return p;
}

export type FileActivityEvent = {
  type: 'file:save' | 'file:create' | 'file:delete' | 'file:rename' | 'file:import';
  message: string;
};

export async function currentUserIdentity(): Promise<{ id: string; name: string } | null> {
  try {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    if (!user?.id) return null;
    return { id: user.id, name: user.email?.split('@')[0] || user.user_metadata?.full_name || 'User' };
  } catch {
    return null;
  }
}

/**
 * Publish a file activity event to a project's dashboard channel
 * (`wonder:dash:{projectId}`) so the WonderRealtimeWidget shows live activity.
 */
export async function broadcastFileEvent(projectId: string, event: FileActivityEvent) {
  try {
    const me = await currentUserIdentity();
    const ch = await getChannel(`wonder:dash:${projectId}`);
    await ch.send({
      type: 'broadcast',
      event: 'wb',
      payload: {
        type: event.type,
        message: event.message,
        from: me?.name ?? me?.id ?? 'User',
      },
    });
  } catch {
    // Realtime is best-effort; never break the editor if broadcast fails.
  }
}
