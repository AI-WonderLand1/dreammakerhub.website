import {
  EventName, EventEnvelope, EventHandler, WildcardHandler,
  EventPayload, Unsubscribe, Transaction, EventNames,
} from './types';

export class EventBus {
  private handlers = new Map<EventName, Set<EventHandler<any>>>();
  private wildcardHandlers = new Set<WildcardHandler>();
  private history: EventEnvelope[] = [];
  private maxHistory = 1000;
  private activeTransactions = new Map<string, Transaction>();
  private batchQueue: EventEnvelope[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private batchDelayMs = 16;
  private source: string;

  constructor(source = 'pipeline') {
    this.source = source;
  }

  on<N extends EventName>(name: N, handler: EventHandler<N>): Unsubscribe {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler);
    return () => { set?.delete(handler); };
  }

  onWildcard(handler: WildcardHandler): Unsubscribe {
    this.wildcardHandlers.add(handler);
    return () => { this.wildcardHandlers.delete(handler); };
  }

  once<N extends EventName>(name: N, handler: EventHandler<N>): Unsubscribe {
    const wrapper: EventHandler<N> = (event) => {
      handler(event);
      unsub();
    };
    const unsub = this.on(name, wrapper);
    return unsub;
  }

  emit<N extends EventName>(
    name: N,
    payload: EventPayload<N>,
    options?: { transactionId?: string; batch?: boolean }
  ): void {
    const event: EventEnvelope<N> = {
      name,
      payload,
      timestamp: Date.now(),
      transactionId: options?.transactionId,
      source: this.source,
    };

    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (options?.transactionId) {
      const tx = this.activeTransactions.get(options.transactionId);
      tx?.events.push(event);
    }

    if (options?.batch) {
      this.batchQueue.push(event);
      this.scheduleBatch();
      return;
    }

    this.dispatch(event);
  }

  private scheduleBatch(): void {
    if (this.batchTimeout) return;
    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      const batch = this.batchQueue.splice(0);
      for (const event of batch) {
        this.dispatch(event);
      }
    }, this.batchDelayMs);
  }

  private dispatch<N extends EventName>(event: EventEnvelope<N>): void {
    const set = this.handlers.get(event.name);
    if (set) {
      for (const handler of set) {
        try { handler(event); } catch (err) {
          console.error(`[EventBus] Error in handler for ${event.name}:`, err);
        }
      }
    }
    for (const handler of this.wildcardHandlers) {
      try { handler(event as EventEnvelope); } catch (err) {
        console.error('[EventBus] Error in wildcard handler:', err);
      }
    }
  }

  beginTransaction(): string {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.activeTransactions.set(id, {
      id,
      events: [],
      status: 'pending',
      createdAt: Date.now(),
      rollbackActions: [],
    });
    return id;
  }

  addRollbackAction(transactionId: string, action: () => void): void {
    const tx = this.activeTransactions.get(transactionId);
    if (tx) {
      tx.rollbackActions.push(action);
    }
  }

  commitTransaction(transactionId: string): void {
    const tx = this.activeTransactions.get(transactionId);
    if (!tx) return;
    tx.status = 'committed';
    this.activeTransactions.delete(transactionId);
  }

  rollbackTransaction(transactionId: string): void {
    const tx = this.activeTransactions.get(transactionId);
    if (!tx) return;
    tx.status = 'rolled-back';
    for (let i = tx.rollbackActions.length - 1; i >= 0; i--) {
      try {
        tx.rollbackActions[i]();
      } catch (err) {
        console.error('[EventBus] Rollback action failed:', err);
      }
    }
    this.activeTransactions.delete(transactionId);
  }

  getHistory(): EventEnvelope[] {
    return [...this.history];
  }

  getHistoryFor(name: EventName): EventEnvelope[] {
    return this.history.filter((e) => e.name === name);
  }

  replay(fromIndex?: number, toIndex?: number): void {
    const slice = fromIndex !== undefined && toIndex !== undefined
      ? this.history.slice(fromIndex, toIndex + 1)
      : [...this.history];
    for (const event of slice) {
      this.dispatch(event);
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  getTransaction(id: string): Transaction | undefined {
    return this.activeTransactions.get(id);
  }

  destroy(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
    this.history = [];
    this.activeTransactions.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

let globalBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!globalBus) {
    globalBus = new EventBus('global');
  }
  return globalBus;
}

export function resetEventBus(): void {
  if (globalBus) {
    globalBus.destroy();
    globalBus = null;
  }
}
