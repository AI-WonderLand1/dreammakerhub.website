/**
 * Playground Sync Client
 * Use this library in the playground to sync data with the main DreamMakerHub site.
 * 
 * Installation in playground:
 *   npm install @dreammakerhub/playground-sync
 * 
 * Usage:
 *   import { PlaygroundSync } from '@dreammakerhub/playground-sync';
 *   
 *   const sync = new PlaygroundSync({
 *     apiUrl: 'https://dreammakerhub.website',
 *     syncKey: 'your-sync-key'
 *   });
 *   
 *   // Track usage
 *   await sync.trackUsage('user-123', 150, 'gpt-4');
 *   
 *   // Update token balance
 *   await sync.addTokens('user-123', 500, 'purchase');
 *   
 *   // Report session status
 *   await sync.reportStatus('user-123', 'active', 'session-abc');
 *   
 *   // Subscribe to real-time updates
 *   sync.subscribeToRealtime('user-123', (event) => {
 *     console.log('Real-time update:', event);
 *   });
 */

export interface PlaygroundSyncConfig {
  apiUrl: string;
  syncKey: string;
  timeout?: number;
}

export interface UsageData {
  userId: string;
  tokens: number;
  model?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface TokenData {
  userId: string;
  amount: number;
  action: 'add' | 'subtract' | 'set';
  reason?: string;
  transactionId?: string;
}

export interface StatusData {
  userId: string;
  status: 'started' | 'active' | 'completed' | 'error';
  sessionId?: string;
  model?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncResponse {
  ok: boolean;
  error?: string;
  traceId?: string;
  data?: unknown;
}

export interface RealtimeEvent {
  type: 'usage' | 'tokens' | 'transaction' | 'status' | 'connected' | 'heartbeat';
  event?: string;
  data?: unknown;
  timestamp: string;
}

export type RealtimeCallback = (event: RealtimeEvent) => void;

export class PlaygroundSync {
  private config: PlaygroundSyncConfig;

  constructor(config: PlaygroundSyncConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };
  }

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' = 'POST',
    body?: unknown
  ): Promise<SyncResponse & { data?: T }> {
    const url = `${this.config.apiUrl}/api/sync${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-sync-key': this.config.syncKey,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { ok: false, error: 'Request timeout' };
        }
        return { ok: false, error: error.message };
      }
      
      return { ok: false, error: 'Unknown error' };
    }
  }

  /**
   * Track token usage from a playground session.
   */
  async trackUsage(
    userId: string,
    tokens: number,
    model?: string,
    sessionId?: string,
    metadata?: Record<string, unknown>
  ): Promise<SyncResponse> {
    return this.request('/playground-usage', 'POST', {
      userId,
      tokens,
      model,
      sessionId,
      metadata,
    });
  }

  /**
   * Get combined usage data for a user.
   */
  async getUsage(userId: string): Promise<SyncResponse & { 
    data?: { 
      playground: { totalTokens: number; lastModel: string };
      mainSite: { tokensUsed: number };
      combined: { totalTokens: number };
    }
  }> {
    return this.request(`/playground-usage?userId=${userId}`, 'GET');
  }

  /**
   * Add tokens to a user's balance.
   */
  async addTokens(
    userId: string,
    amount: number,
    reason?: string,
    transactionId?: string
  ): Promise<SyncResponse & { data?: { balance: number } }> {
    return this.request('/playground-tokens', 'POST', {
      userId,
      action: 'add',
      amount,
      reason,
      transactionId,
    });
  }

  /**
   * Subtract tokens from a user's balance.
   */
  async subtractTokens(
    userId: string,
    amount: number,
    reason?: string,
    transactionId?: string
  ): Promise<SyncResponse & { data?: { balance: number } }> {
    return this.request('/playground-tokens', 'POST', {
      userId,
      action: 'subtract',
      amount,
      reason,
      transactionId,
    });
  }

  /**
   * Set a user's token balance.
   */
  async setTokens(
    userId: string,
    amount: number,
    reason?: string,
    transactionId?: string
  ): Promise<SyncResponse & { data?: { balance: number } }> {
    return this.request('/playground-tokens', 'POST', {
      userId,
      action: 'set',
      amount,
      reason,
      transactionId,
    });
  }

  /**
   * Get token balance and recent transactions.
   */
  async getTokenBalance(userId: string): Promise<SyncResponse & {
    data?: {
      balance: number;
      lastUpdated: string;
      transactions: Array<{
        action: string;
        amount: number;
        reason: string;
        created_at: string;
      }>;
    }
  }> {
    return this.request(`/playground-tokens?userId=${userId}`, 'GET');
  }

  /**
   * Report session status.
   */
  async reportStatus(
    userId: string,
    status: 'started' | 'active' | 'completed' | 'error',
    sessionId?: string,
    model?: string,
    error?: string,
    metadata?: Record<string, unknown>
  ): Promise<SyncResponse> {
    return this.request('/playground-status', 'POST', {
      userId,
      status,
      sessionId,
      model,
      error,
      metadata,
    });
  }

  /**
   * Get active sessions and status.
   */
  async getStatus(userId?: string): Promise<SyncResponse & {
    data?: {
      sessions: Array<{
        user_id: string;
        status: string;
        session_id: string;
        model: string;
        created_at: string;
      }>;
      activeCount: number;
    }
  }> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request(`/playground-status${params}`, 'GET');
  }

  /**
   * Subscribe to real-time updates via Server-Sent Events.
   * Returns an unsubscribe function.
   */
  subscribeToRealtime(
    userId: string,
    callback: RealtimeCallback,
    events: string[] = ['usage', 'tokens', 'status']
  ): () => void {
    const params = new URLSearchParams({ userId, events: events.join(',') });
    const url = `${this.config.apiUrl}/api/sync/realtime?${params.toString()}`;

    const eventSource = new EventSource(url, {
      withCredentials: false,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        callback(data);
      } catch (e) {
        console.error('Failed to parse realtime event:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Realtime connection error:', error);
      callback({ type: 'heartbeat', timestamp: new Date().toISOString() });
    };

    // Return unsubscribe function
    return () => {
      eventSource.close();
    };
  }

  /**
   * Create an EventSource for real-time updates (browser only).
   */
  createRealtimeConnection(
    userId: string,
    events: string[] = ['usage', 'tokens', 'status']
  ): EventSource | null {
    if (typeof EventSource === 'undefined') {
      console.warn('EventSource not supported in this environment');
      return null;
    }

    const params = new URLSearchParams({ userId, events: events.join(',') });
    const url = `${this.config.apiUrl}/api/sync/realtime?${params.toString()}`;

    return new EventSource(url, {
      withCredentials: false,
    });
  }
}

// Export a factory function for easy setup
export function createPlaygroundSync(config: PlaygroundSyncConfig): PlaygroundSync {
  return new PlaygroundSync(config);
}

// Export default instance if environment variables are set
let defaultInstance: PlaygroundSync | null = null;

export function getPlaygroundSync(): PlaygroundSync | null {
  if (defaultInstance) return defaultInstance;

  const apiUrl = process.env.DREAMMAKERHUB_API_URL || process.env.NEXT_PUBLIC_APP_URL;
  const syncKey = process.env.PLAYGROUND_SYNC_KEY;

  if (!apiUrl || !syncKey) return null;

  defaultInstance = new PlaygroundSync({ apiUrl, syncKey });
  return defaultInstance;
}
