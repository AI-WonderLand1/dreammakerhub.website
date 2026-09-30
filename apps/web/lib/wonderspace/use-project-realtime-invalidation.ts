"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type ProjectRealtimeScope = "issues" | "discussions" | "wiki" | "files";

export function useProjectRealtimeInvalidation(
  projectId: string,
  scope: ProjectRealtimeScope,
  onInvalidate: () => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onInvalidate);

  useEffect(() => {
    callbackRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !projectId) return;

    const channel = supabase.channel(`dmh:project-data:${projectId}`, {
      config: { broadcast: { self: false, ack: false } },
    });

    channel
      .on("broadcast", { event: "project-data-changed" }, ({ payload }) => {
        const changed = payload as { scope?: ProjectRealtimeScope } | null;
        if (changed?.scope === scope) callbackRef.current();
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [projectId, scope]);

  return useCallback(async () => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.send({
      type: "broadcast",
      event: "project-data-changed",
      payload: { scope },
    });
  }, [scope]);
}
