import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type AnalyticsEventPayload } from './types';
import { logger } from '@/lib/logger';

export class AnalyticsService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private eventQueue: AnalyticsEventPayload[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private flushIntervalMs = 5000;

  start(): void {
    this.unsubs.push(
      this.bus.on(EventNames.ANALYTICS_TRACK, (event) => {
        const payload = event.payload as EventPayload<typeof EventNames.ANALYTICS_TRACK>;
        this.enqueue(payload);
      })
    );

    this.unsubs.push(
      this.bus.onWildcard((event) => {
        const trackable = EVENT_TRACKABLE[event.name as string];
        if (trackable) {
          this.enqueue({
            action: event.name,
            category: trackable.category,
            label: trackable.label,
            value: 1,
            metadata: { source: event.source, timestamp: event.timestamp },
          });
        }
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ANALYTICS_FLUSH, () => {
        this.flush();
      })
    );
  }

  private enqueue(event: AnalyticsEventPayload): void {
    this.eventQueue.push(event);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;
    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private isFlushing = false;

  private flush(): void {
    if (this.isFlushing || this.eventQueue.length === 0) return;
    this.isFlushing = true;
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    const batch = this.eventQueue.splice(0);

    try {
      if (typeof window !== 'undefined' && 'fetch' in window) {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batch, ts: Date.now() }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}

    logger.info(`[Analytics] Flushed ${batch.length} events`);
    this.isFlushing = false;
  }

  track(action: string, category: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    this.bus.emit(EventNames.ANALYTICS_TRACK, { action, category, label, value, metadata });
  }

  stop(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    this.flush();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

const EVENT_TRACKABLE: Record<string, { category: string; label: string }> = {
  'builder:element:added': { category: 'element', label: 'add' },
  'builder:element:removed': { category: 'element', label: 'remove' },
  'builder:element:duplicated': { category: 'element', label: 'duplicate' },
  'builder:element:moved': { category: 'element', label: 'move' },
  'builder:elements:cleared': { category: 'element', label: 'clear' },
  'validation:completed': { category: 'validation', label: 'result' },
  'storage:saved': { category: 'storage', label: 'save' },
  'storage:loaded': { category: 'storage', label: 'load' },
  'code:generated': { category: 'codegen', label: 'generate' },
  'ai:generation:started': { category: 'ai', label: 'generate-start' },
  'ai:generation:completed': { category: 'ai', label: 'generate-complete' },
};

export const analyticsService = new AnalyticsService();
