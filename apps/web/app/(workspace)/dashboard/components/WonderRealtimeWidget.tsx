"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

type PresenceUser = {
  userId: string;
  name?: string;
};

export type WonderActivityItem = {
  ts: number;
  type: string;
  message: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WonderRealtimeWidget(props: {
  projectId?: string | null;
  title?: string;
  compact?: boolean;
  showTestButton?: boolean;
  onActivity?: (item: WonderActivityItem) => void;
  onPresenceChange?: (online: PresenceUser[]) => void;
}) {
  const {
    projectId,
    title = "Live activity",
    compact = false,
    showTestButton = true,
    onActivity,
    onPresenceChange,
  } = props;

  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [activity, setActivity] = useState<WonderActivityItem[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const activityCallbackRef = useRef(onActivity);
  const presenceCallbackRef = useRef(onPresenceChange);

  useEffect(() => {
    activityCallbackRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    presenceCallbackRef.current = onPresenceChange;
  }, [onPresenceChange]);

  const me = useMemo<PresenceUser>(() => {
    const id = `guest-${crypto.randomUUID().slice(0, 8)}`;
    return { userId: id, name: "Guest" };
  }, []);

  const [meState, setMeState] = useState<PresenceUser>(me);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const sb = getSupabaseClient();
        if (!sb) return;
        const { data: { user } } = await sb.auth.getUser();
        if (user?.id) {
          const name = user.email?.split("@")[0] || user.user_metadata?.full_name || "User";
          setMeState({ userId: user.id, name });
        }
      } catch (err) {
        logger.warn("[Realtime] Failed to resolve user:", err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus("error");
      const item = { ts: Date.now(), type: "error", message: "Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY" };
      setActivity((a) => [item, ...a]);
      activityCallbackRef.current?.(item);
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setStatus("connecting");

    const room = projectId ? `wonder:dash:${projectId}` : "wonder:dash:global";
    const channel = supabase.channel(room, {
      config: {
        presence: { key: meState.userId },
        broadcast: { self: false, ack: false },
      },
    });

    channel.on("broadcast", { event: "wb" }, (msg) => {
      const payload = (msg.payload ?? {}) as { type?: string; message?: string; from?: string };
      const item = {
        ts: Date.now(),
        type: payload.type ?? "event",
        message: payload.message ?? JSON.stringify(payload),
      };
      setActivity((a) => [item, ...a].slice(0, 30));
      activityCallbackRef.current?.(item);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>;
      const flattened: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        const arr = state[key] || [];
        for (const u of arr) flattened.push(u);
      }
      const map = new Map<string, PresenceUser>();
      for (const u of flattened) map.set(u.userId, u);
      const nextOnline = Array.from(map.values());
      setOnline(nextOnline);
      presenceCallbackRef.current?.(nextOnline);
    });

    if (projectId) {
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
        () => {
          const item = { ts: Date.now(), type: "db", message: "Project updated" };
          setActivity((a) => [item, ...a].slice(0, 30));
          activityCallbackRef.current?.(item);
        }
      );
    }

    channel.subscribe(async (s) => {
      if (s === "SUBSCRIBED") {
        setStatus("live");
        await channel.track(meState);
        await channel.send({
          type: "broadcast",
          event: "wb",
          payload: { type: "presence", message: `${meState.name ?? meState.userId} joined`, from: meState.userId },
        });
      } else if (s === "CHANNEL_ERROR") {
        setStatus("error");
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId, meState.userId]);

  const sendTest = async () => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "wb",
      payload: { type: "ping", message: "Hello from dashboard", from: meState.userId },
    });
  };

  if (compact) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">{title}</h2>
          <div className="flex items-center gap-2 text-[11px] text-white/45">
            <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-400" : status === "error" ? "bg-red-400" : "bg-amber-400"}`} />
            {status === "live" ? `${online.length} online` : status}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {activity.length === 0 ? (
            <div className="rounded-lg border border-white/5 bg-white/[.025] px-3 py-4 text-xs text-white/35">No live activity yet.</div>
          ) : (
            activity.slice(0, 6).map((it) => (
              <div key={it.ts + it.type + it.message} className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white/75">{it.message}</p>
                  <p className="mt-1 text-[10px] text-white/35">{new Date(it.ts).toLocaleTimeString()} · {it.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0b0f] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">{title}</div>
          <div className="mt-1 text-[11px] text-white/40">
            Status:{" "}
            <span className={status === "live" ? "text-emerald-400" : "text-white/60"}>{status}</span>
            {projectId ? ` • Project: ${projectId}` : " • Global"}
          </div>
        </div>

        {showTestButton && (
          <button type="button" onClick={sendTest} className="rounded-lg border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:border-white/20">
            Send ping
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-3 md:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Online</div>
          <div className="mt-2 space-y-1">
            {online.length === 0 ? (
              <div className="text-[11px] text-white/35">No one online</div>
            ) : (
              online.map((u) => <div key={u.userId} className="text-[11px] text-white/70">{u.name ?? u.userId}</div>)
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 p-3 md:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Activity</div>
          <div className="custom-scrollbar mt-2 max-h-56 space-y-2 overflow-auto">
            {activity.length === 0 ? (
              <div className="text-[11px] text-white/35">No events yet</div>
            ) : (
              activity.map((it) => (
                <div key={it.ts + it.type + it.message} className="text-[11px] text-white/70">
                  <span className="mr-2 text-white/40">{new Date(it.ts).toLocaleTimeString()}</span>
                  <span className="mr-2 text-cyan-300">[{it.type}]</span>
                  {it.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
