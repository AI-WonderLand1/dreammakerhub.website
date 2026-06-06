/**
 * Local Memory Service - IndexedDB for short-term session state
 * "Short-term Memory" that syncs to Python Memory Bank via SyncGuard
 */

const DB_NAME = "WonderlandLocal";
const DB_VERSION = 1;
const STORE_THOUGHTS = "thoughts";
const STORE_CHANGES = "pendingChanges";
const STORE_SYNC_QUEUE = "syncQueue";

export interface ThoughtEntry {
  id?: number;
  content: string;
  persona: string;
  timestamp: number;
  synced: boolean;
}

export interface PendingChange {
  id?: number;
  type: "code" | "memory" | "config";
  path: string;
  content: unknown;
  timestamp: number;
  synced: boolean;
}

class LocalMemoryService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_THOUGHTS)) {
          const store = db.createObjectStore(STORE_THOUGHTS, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("synced", "synced", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_CHANGES)) {
          const store = db.createObjectStore(STORE_CHANGES, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("synced", "synced", { unique: false });
          store.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          db.createObjectStore(STORE_SYNC_QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
    });

    return this.initPromise;
  }

  // Thoughts (AI conversation context)
  async saveThought(content: string, persona: string): Promise<void> {
    await this.init();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_THOUGHTS, "readwrite");
      const store = tx.objectStore(STORE_THOUGHTS);

      const entry: ThoughtEntry = {
        content,
        persona,
        timestamp: Date.now(),
        synced: false,
      };

      const request = store.add(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getThoughts(limit: number = 50): Promise<ThoughtEntry[]> {
    await this.init();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_THOUGHTS, "readonly");
      const store = tx.objectStore(STORE_THOUGHTS);
      const index = store.index("timestamp");
      const request = index.openCursor(null, "prev");
      const results: ThoughtEntry[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Pending changes (code edits, etc.)
  async savePendingChange(type: PendingChange["type"], path: string, content: unknown): Promise<void> {
    await this.init();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHANGES, "readwrite");
      const store = tx.objectStore(STORE_CHANGES);

      const entry: PendingChange = {
        type,
        path,
        content,
        timestamp: Date.now(),
        synced: false,
      };

      const request = store.add(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedChanges(): Promise<PendingChange[]> {
    await this.init();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHANGES, "readonly");
      const store = tx.objectStore(STORE_CHANGES);
      const index = store.index("synced");
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(storeName: string, ids: number[]): Promise<void> {
    await this.init();
    const db = this.db!;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      let completed = 0;
      ids.forEach((id) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const entry = getRequest.result;
          if (entry) {
            entry.synced = true;
            store.put(entry);
          }
          completed++;
          if (completed === ids.length) resolve();
        };
        getRequest.onerror = () => reject(getRequest.error);
      });

      if (ids.length === 0) resolve();
    });
  }

  // Clear old synced entries
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.init();
    const db = this.db!;
    const cutoff = Date.now() - maxAge;

    const stores = [STORE_THOUGHTS, STORE_CHANGES];
    for (const storeName of stores) {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const index = store.index("synced");
      const request = index.openCursor(IDBKeyRange.only(true));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }
}

export const localMemory = new LocalMemoryService();
