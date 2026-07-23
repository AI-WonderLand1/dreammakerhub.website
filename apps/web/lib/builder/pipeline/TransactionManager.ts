import { getEventBus } from './EventBus';
import { EventNames } from './types';

export class TransactionManager {
  private activeTxId: string | null = null;

  begin(): string {
    const bus = getEventBus();
    const id = bus.beginTransaction();
    this.activeTxId = id;
    return id;
  }

  commit(): void {
    if (!this.activeTxId) return;
    const bus = getEventBus();
    bus.commitTransaction(this.activeTxId);
    this.activeTxId = null;
  }

  rollback(): void {
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

  async run<T>(fn: (tx: string) => Promise<T>): Promise<T> {
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

  get currentTransactionId(): string | null {
    return this.activeTxId;
  }
}

export const transactionManager = new TransactionManager();
