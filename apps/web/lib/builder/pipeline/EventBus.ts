import {
  EventName, EventEnvelope, EventHandler, EventPayload, Unsubscribe,
  Transaction, EventNames,
} from './types';

type HandlerMap = Map<EventName, Set<EventHandler<any>>>;

export class EventBus {
  private handlers: HandlerMap = new Map();
  private history: EventEnvelope[] = [];
  private maxHistory = 500;
  private activeTransactions: Map<string, Transaction> = new Map();
  private batchQueue: EventEnvelope[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private batchDelayMs = 16;
  private source: string;

  constructor(source = 'pipeline') {
    this.source = source;
  }

  on<N extends EventName>(name: N, handler: EventHandler<N>): Unsubscribe {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Set());
    }
    this.handlers.get(name)!.add(handler);
    return () => this.handlers.get(name)?.delete(handler);
  }

  once<N extends EventName>(name: N, handler: EventHandler<N>): Unsubscribe {
    const wrapper: EventHandler<N> = (event) => {
      handler(event);
      unsub();
    };
    const unsub = this.on(name, wrapper);
    return unsub;
  }

  emit<N extends EventName>(name: N, payload: EventPayload<N>, options?: { transactionId?: string; batch?: boolean }): void {
    const event: EventEnvelope<N> = {
      name,
      payload,
      timestamp: Date.now(),
      transactionId: options?.transactionId,
      source: this.source,
    };

    // Store in history
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Add to transaction if active
    if (options?.transactionId) {
      const tx = this.activeTransactions.get(options.transactionId);
      if (tx) {
        tx.events.push(event);
      }
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
    const handlers = this.handlers.get(event.name);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${event.name}:`, err);
        }
      }
    }
    // Also dispatch wildcard listeners
    const wildcardHandlers = this.handlers.get('*' as any);
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error('[EventBus] Error in wildcard handler:', err);
        }
      }
    }
  }

  // Transactions
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
    // Execute rollback actions in reverse order
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

  clearHistory(): void {
    this.history = [];
  }

  getTransaction(id: string): Transaction | undefined {
    return this.activeTransactions.get(id);
  }

  destroy(): void {
    this.handlers.clear();
    this.history = [];
    this.activeTransactions.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Singleton instance
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
