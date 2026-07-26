import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';

export class TransactionManager {
  private activeTxId: string | null = null;
  private depth = 0;

  begin(): string {
    this.depth++;
    if (this.depth === 1) {
      const bus = getEventBus();
      const id = bus.beginTransaction();
      this.activeTxId = id;
      return id;
    }
    return this.activeTxId!;
  }

  commit(): void {
    this.depth--;
    if (this.depth === 0 && this.activeTxId) {
      const bus = getEventBus();
      bus.commitTransaction(this.activeTxId);
      this.activeTxId = null;
    }
  }

  rollback(): void {
    this.depth = 0;
    if (!this.activeTxId) return;
    const bus = getEventBus();
    bus.rollbackTransaction(this.activeTxId);
    this.activeTxId = null;
  }

  addRollback(action: () => void): void {
    if (!this.activeTxId) return;
    const bus = getEventBus();
    bus.addRollbackAction(this.activeTxId, action);
  }

  async run<T>(fn: (txId: string) => Promise<T>): Promise<T> {
    const id = this.begin();
    try {
      const result = await fn(id);
      this.commit();
      return result;
    } catch (err) {
      this.rollback();
      const bus = getEventBus();
      bus.emit(EventNames.SYSTEM_ERROR, {
        message: err instanceof Error ? err.message : 'Transaction failed',
        context: { transactionId: id },
      });
      throw err;
    }
  }

  snapshotBeforeMutate(): void {
    const current = JSON.parse(JSON.stringify(useBuilderStore.getState().elements));
    this.addRollback(() => {
      useBuilderStore.getState().setElements(current);
    });
  }

  get currentTransactionId(): string | null {
    return this.activeTxId;
  }
}

export const transactionManager = new TransactionManager();
