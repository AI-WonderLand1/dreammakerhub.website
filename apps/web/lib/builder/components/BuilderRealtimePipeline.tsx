'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { useBuilderStore } from '../store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ConnectionStatus = 'idle' | 'connecting' | 'live' | 'error';

export default function BuilderRealtimePipeline({ projectId }: { projectId?: string }) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [activityCount, setActivityCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus('error');
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    setStatus('connecting');
    const room = projectId ? `wonder:dash:${projectId}` : 'wonder:dash:builder';
    const channel = supabase.channel(room, {
      config: {
        presence: { key: 'builder' },
        broadcast: { self: false, ack: false },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      setActivityCount((c) => c + 1);
    });

    channel.subscribe(async (s) => {
      if (s === 'SUBSCRIBED') {
        setStatus('live');
        await channel.track({ userId: 'builder', name: 'Builder' });
        await channel.send({
          type: 'broadcast',
          event: 'wb',
          payload: { type: 'builder', message: 'Builder connected', from: 'builder' },
        });
      } else if (s === 'CHANNEL_ERROR') {
        setStatus('error');
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId]);

  // Broadcast element changes
  useEffect(() => {
    const unsub = useBuilderStore.subscribe((state, prev) => {
      const channel = channelRef.current;
      if (!channel || state.elements === prev.elements) return;

      const count = state.elements.length;
      const prevCount = prevCountRef.current;
      prevCountRef.current = count;

      let message = `${count} element${count !== 1 ? 's' : ''}`;
      let type = 'update';
      if (count > prevCount) {
        type = 'add';
        message = `+${count - prevCount} element${count - prevCount !== 1 ? 's' : ''} (${count} total)`;
      } else if (count < prevCount) {
        type = 'remove';
        message = `-${prevCount - count} element${prevCount - count !== 1 ? 's' : ''} (${count} total)`;
      }

      channel.send({
        type: 'broadcast',
        event: 'wb',
        payload: { type, message, from: 'builder', ts: Date.now() },
      }).catch(() => {});
    });
    return unsub;
  }, []);

  if (status === 'idle' || status === 'connecting') {
    return (
      <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/30">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        {status === 'connecting' ? 'connecting...' : 'pipeline'}
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 rounded-full border border-red-900/30 bg-red-900/10 px-2 py-0.5 text-[9px] text-red-400/60" title="Realtime pipeline unavailable">
        ⚡ offline
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1 rounded-full border border-emerald-900/30 bg-emerald-900/10 px-2 py-0.5 text-[9px] text-emerald-400/70"
      title={`Realtime pipeline live · ${activityCount} events`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
      ⚡ live
    </span>
  );
}
