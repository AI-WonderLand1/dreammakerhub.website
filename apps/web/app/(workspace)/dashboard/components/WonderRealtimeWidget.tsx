"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

type PresenceUser = {
  userId: string;
  name?: string;
};

type ActivityItem = {
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
}) {
  const { projectId, title = "Live activity" } = props;

  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const me = useMemo<PresenceUser>(() => {
    // If you have auth later, replace this with real user id + name.
    const id = `guest-${Math.random().toString(16).slice(2)}`;
    return { userId: id, name: "Guest" };
  }, []);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus("error");
      setActivity((a) => [
        { ts: Date.now(), type: "error", message: "Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY" },
        ...a,
      ]);
      return;
    }

    // cleanup old channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setStatus("connecting");

    // If no projectId, we can still run a global dashboard channel
    const room = projectId ? `wonder:dash:${projectId}` : "wonder:dash:global";

    const channel = supabase.channel(room, {
      config: { presence: { key: me.userId } },
    });

    // Broadcast activity events (fast)
    channel.on("broadcast", { event: "wb" }, (msg) => {
      const payload = (msg.payload ?? {}) as { type?: string; message?: string; from?: string };
      const t = payload.type ?? "event";
      const m = payload.message ?? JSON.stringify(payload);
      setActivity((a) => [{ ts: Date.now(), type: t, message: m }, ...a].slice(0, 30));
    });

    // Presence: online users
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>;
      const flattened: PresenceUser[] = [];
      for (const key of Object.keys(state)) {
        const arr = state[key] || [];
        for (const u of arr) flattened.push(u);
      }
      // Deduplicate by userId
      const map = new Map<string, PresenceUser>();
      for (const u of flattened) map.set(u.userId, u);
      setOnline(Array.from(map.values()));
    });

    // Optional: listen to db updates just to show “something changed”
    // Adjust table/column if you want; or remove this block.
    if (projectId) {
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
        () => {
          setActivity((a) => [
            { ts: Date.now(), type: "db", message: "Project updated" },
            ...a,
          ].slice(0, 30));
        }
      );
    }

    channel.subscribe(async (s) => {
      if (s === "SUBSCRIBED") {
        setStatus("live");
        await channel.track(me);
        // Announce join
        await channel.send({
          type: "broadcast",
          event: "wb",
          payload: { type: "presence", message: `${me.name ?? me.userId} joined`, from: me.userId },
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
  }, [projectId, me.userId]);

  const sendTest = async () => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "wb",
      payload: { type: "ping", message: "Hello from dashboard", from: me.userId },
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0b0f] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
            {title}
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            Status:{" "}
            <span className={status === "live" ? "text-emerald-400" : "text-white/60"}>
              {status}
            </span>
            {projectId ? ` • Project: ${projectId}` : " • Global"}
          </div>
        </div>

        <button
          type="button"
          onClick={sendTest}
          className="text-[11px] px-3 py-1 rounded-lg border border-white/10 hover:border-white/20 text-white/70"
        >
          Send ping
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1 rounded-lg border border-white/10 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
            Online
          </div>
          <div className="mt-2 space-y-1">
            {online.length === 0 ? (
              <div className="text-[11px] text-white/35">No one online</div>
            ) : (
              online.map((u) => (
                <div key={u.userId} className="text-[11px] text-white/70">
                  {u.name ?? u.userId}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border border-white/10 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
            Activity
          </div>
          <div className="mt-2 space-y-2 max-h-56 overflow-auto custom-scrollbar">
            {activity.length === 0 ? (
              <div className="text-[11px] text-white/35">No events yet</div>
            ) : (
              activity.map((it) => (
                <div key={it.ts + it.type + it.message} className="text-[11px] text-white/70">
                  <span className="text-white/40 mr-2">
                    {new Date(it.ts).toLocaleTimeString()}
                  </span>
                  <span className="text-cyan-300 mr-2">[{it.type}]</span>
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
