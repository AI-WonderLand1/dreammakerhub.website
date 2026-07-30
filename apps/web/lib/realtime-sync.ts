'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { logger } from '@/lib/logger';

type SyncEvent = {
  event: string;
  data: any;
  ts: number;
};

type SyncSource = 'builder' | 'dashboard' | 'ide';

interface UseRealtimeSyncOptions {
  projectId: string;
  source: SyncSource;
  onEvent?: (event: SyncEvent) => void;
}

export function useRealtimeSync({ projectId, source, onEvent }: UseRealtimeSyncOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/sync/realtime?projectId=${encodeURIComponent(projectId)}&source=${source}`;
    const es = new EventSource(url);

    es.onopen = () => {
      setConnected(true);
      logger.info(`[RealtimeSync] Connected: ${source} → ${projectId}`);
    };

    es.onmessage = (msg) => {
      try {
        const event: SyncEvent = JSON.parse(msg.data);
        if (event.type === 'heartbeat') return;
        setLastEvent(event);
        onEvent?.(event);
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      logger.warn(`[RealtimeSync] Disconnected, reconnecting...`);
      es.close();
      setTimeout(connect, 3000);
    };

    eventSourceRef.current = es;
  }, [projectId, source, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  const broadcast = useCallback(async (event: string, data: any) => {
    try {
      await fetch('/api/sync/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, event, data }),
      });
    } catch (err) {
      logger.error('[RealtimeSync] Broadcast failed:', err);
    }
  }, [projectId]);

  return { connected, lastEvent, broadcast };
}
