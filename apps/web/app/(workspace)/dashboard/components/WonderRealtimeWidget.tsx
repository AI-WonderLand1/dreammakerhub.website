"use client";

import React, { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { ensureSupabaseConfig, getSupabaseClient } from '@/lib/supabase/client';
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
  const [meState, setMeState] = useState<PresenceUser>({ userId: "guest", name: "Guest" });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientRef = useRef<SupabaseClient | null>(null);
  const activityCallbackRef = useRef(onActivity);
  const presenceCallbackRef = useRef(onPresenceChange);

  useEffect(() => {
    activityCallbackRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    presenceCallbackRef.current = onPresenceChange;
  }, [onPresenceChange]);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        await ensureSupabaseConfig();
        const sb = getSupabaseClient();
        if (!sb || cancelled) return;
        const { data: { user } } = await sb.auth.getUser();
        if (cancelled) return;

        if (user?.id) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
          setMeState({ userId: user.id, name });
        } else {
          setMeState({ userId: `guest-${crypto.randomUUID().slice(0, 8)}`, name: "Guest" });
        }
      } catch (err) {
        logger.warn("[Realtime] Failed to resolve user:", err);
        if (!cancelled) {
          setMeState({ userId: `guest-${crypto.randomUUID().slice(0, 8)}`, name: "Guest" });
        }
      }
    };

    void loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let localChannel: RealtimeChannel | null = null;
    let localClient: SupabaseClient | null = null;

    const connect = async () => {
      await ensureSupabaseConfig();
      if (cancelled) return;

      const supabase = getSupabaseClient();
      if (!supabase) {
        setStatus("error");
        const item = { ts: Date.now(), type: "error", message: "Supabase realtime configuration is unavailable" };
        setActivity((items) => [item, ...items]);
        activityCallbackRef.current?.(item);
        return;
      }

      localClient = supabase;
      clientRef.current = supabase;

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
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
      localChannel = channel;

      channel.on("broadcast", { event: "wb" }, (msg) => {
        const payload = (msg.payload ?? {}) as { type?: string; message?: string; from?: string };
        const item = {
          ts: Date.now(),
          type: payload.type ?? "event",
          message: payload.message ?? JSON.stringify(payload),
        };
        setActivity((items) => [item, ...items].slice(0, 30));
        activityCallbackRef.current?.(item);
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const flattened: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const entries = state[key] || [];
          for (const user of entries) flattened.push(user);
        }
        const unique = new Map<string, PresenceUser>();
        for (const user of flattened) unique.set(user.userId, user);
        const nextOnline = Array.from(unique.values());
        setOnline(nextOnline);
        presenceCallbackRef.current?.(nextOnline);
      });

      if (projectId) {
        channel.on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
          () => {
            const item = { ts: Date.now(), type: "db", message: "Project updated" };
            setActivity((items) => [item, ...items].slice(0, 30));
            activityCallbackRef.current?.(item);
          },
        );
      }

      channel.subscribe(async (subscriptionStatus) => {
        if (cancelled) return;
        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("live");
          await channel.track(meState);
          await channel.send({
            type: "broadcast",
            event: "wb",
            payload: { type: "presence", message: `${meState.name ?? meState.userId} joined`, from: meState.userId },
          });
        } else if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
          setStatus("error");
        }
      });

      channelRef.current = channel;
    };

    void connect().catch((err) => {
      logger.warn("[Realtime] Connection failed:", err);
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      if (localClient && localChannel) {
        void localClient.removeChannel(localChannel);
      }
      if (channelRef.current === localChannel) channelRef.current = null;
      if (clientRef.current === localClient) clientRef.current = null;
    };
  }, [projectId, meState.userId, meState.name]);

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
            activity.slice(0, 6).map((item) => (
              <div key={item.ts + item.type + item.message} className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white/75">{item.message}</p>
                  <p className="mt-1 text-[10px] text-white/35">{new Date(item.ts).toLocaleTimeString()} · {item.type}</p>
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
              online.map((user) => <div key={user.userId} className="text-[11px] text-white/70">{user.name ?? user.userId}</div>)
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 p-3 md:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Activity</div>
          <div className="custom-scrollbar mt-2 max-h-56 space-y-2 overflow-auto">
            {activity.length === 0 ? (
              <div className="text-[11px] text-white/35">No events yet</div>
            ) : (
              activity.map((item) => (
                <div key={item.ts + item.type + item.message} className="text-[11px] text-white/70">
                  <span className="mr-2 text-white/40">{new Date(item.ts).toLocaleTimeString()}</span>
                  <span className="mr-2 text-cyan-300">[{item.type}]</span>
                  {item.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
