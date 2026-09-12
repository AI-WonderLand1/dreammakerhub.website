"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

type PresenceUser = {
  userId: string;
  name?: string;
};

type ActivityItem = {
  ts: number;
  type: string;
  message: string;
  from?: string;
};

type ActivityPayload = {
  type: string;
  message: string;
  from?: string;
};

export default function WonderRealtimeWidget(props: {
  projectId?: string | null;
  title?: string;
  compact?: boolean;
  onActivity?: (event: ActivityPayload) => void;
  onPresenceChange?: (users: PresenceUser[]) => void;
}) {
  const {
    projectId,
    title = "Live activity",
    compact = false,
    onActivity,
    onPresenceChange,
  } = props;

  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const activityHandlerRef = useRef(onActivity);
  const presenceHandlerRef = useRef(onPresenceChange);

  useEffect(() => {
    activityHandlerRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    presenceHandlerRef.current = onPresenceChange;
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
          const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
          setMeState({ userId: user.id, name });
        }
      } catch (err) {
        logger.warn("[Realtime] Failed to resolve user:", err);
      }
    };
    void loadUser();
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setActivity((items) => [
        { ts: Date.now(), type: "error", message: "Realtime is unavailable" },
        ...items,
      ]);
      return;
    }

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
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

    channel.on("broadcast", { event: "wb" }, (message) => {
      const payload = (message.payload ?? {}) as { type?: string; message?: string; from?: string };
      const event: ActivityPayload = {
        type: payload.type ?? "event",
        message: payload.message ?? JSON.stringify(payload),
        from: payload.from,
      };
      setActivity((items) => [
        { ts: Date.now(), ...event },
        ...items,
      ].slice(0, 30));
      activityHandlerRef.current?.(event);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>;
      const deduped = new Map<string, PresenceUser>();
      for (const entries of Object.values(state)) {
        for (const user of entries || []) deduped.set(user.userId, user);
      }
      const users = Array.from(deduped.values());
      setOnline(users);
      presenceHandlerRef.current?.(users);
    });

    if (projectId) {
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
        () => {
          const event: ActivityPayload = { type: "db", message: "Project updated" };
          setActivity((items) => [{ ts: Date.now(), ...event }, ...items].slice(0, 30));
          activityHandlerRef.current?.(event);
        },
      );
    }

    channel.subscribe(async (subscriptionStatus) => {
      if (subscriptionStatus === "SUBSCRIBED") {
        setStatus("live");
        await channel.track(meState);
      } else if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") {
        setStatus("error");
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current === channel) channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [projectId, meState.userId, meState.name]);

  if (compact) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0d1625] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">{title}</h2>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${status === "live" ? "text-emerald-400" : status === "error" ? "text-red-300" : "text-white/40"}`}>
            {status}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-white/40">{online.length} online now</p>
        <div className="mt-3 space-y-3">
          {activity.length === 0 ? (
            <p className="text-xs text-white/35">No activity yet.</p>
          ) : activity.slice(0, 6).map((item) => (
            <div key={`${item.ts}-${item.type}-${item.message}`} className="border-l border-white/10 pl-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white/80">{item.from || item.type}</span>
                <span className="text-[10px] text-white/30">{new Date(item.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <p className="mt-0.5 text-white/45">{item.message}</p>
            </div>
          ))}
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
            <span className={status === "live" ? "text-emerald-400" : status === "error" ? "text-red-300" : "text-white/60"}>{status}</span>
            {projectId ? ` • ${online.length} online` : " • Global"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-3 md:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Online</div>
          <div className="mt-2 space-y-1">
            {online.length === 0 ? (
              <div className="text-[11px] text-white/35">No one online</div>
            ) : online.map((user) => (
              <div key={user.userId} className="text-[11px] text-white/70">{user.name ?? user.userId}</div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 p-3 md:col-span-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Activity</div>
          <div className="custom-scrollbar mt-2 max-h-56 space-y-2 overflow-auto">
            {activity.length === 0 ? (
              <div className="text-[11px] text-white/35">No events yet</div>
            ) : activity.map((item) => (
              <div key={`${item.ts}-${item.type}-${item.message}`} className="text-[11px] text-white/70">
                <span className="mr-2 text-white/40">{new Date(item.ts).toLocaleTimeString()}</span>
                <span className="mr-2 text-cyan-300">[{item.type}]</span>
                {item.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
