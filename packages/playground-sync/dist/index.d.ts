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
export declare class PlaygroundSync {
    private config;
    constructor(config: PlaygroundSyncConfig);
    private request;
    /**
     * Track token usage from a playground session.
     */
    trackUsage(userId: string, tokens: number, model?: string, sessionId?: string, metadata?: Record<string, unknown>): Promise<SyncResponse>;
    /**
     * Get combined usage data for a user.
     */
    getUsage(userId: string): Promise<SyncResponse & {
        data?: {
            playground: {
                totalTokens: number;
                lastModel: string;
            };
            mainSite: {
                tokensUsed: number;
            };
            combined: {
                totalTokens: number;
            };
        };
    }>;
    /**
     * Add tokens to a user's balance.
     */
    addTokens(userId: string, amount: number, reason?: string, transactionId?: string): Promise<SyncResponse & {
        data?: {
            balance: number;
        };
    }>;
    /**
     * Subtract tokens from a user's balance.
     */
    subtractTokens(userId: string, amount: number, reason?: string, transactionId?: string): Promise<SyncResponse & {
        data?: {
            balance: number;
        };
    }>;
    /**
     * Set a user's token balance.
     */
    setTokens(userId: string, amount: number, reason?: string, transactionId?: string): Promise<SyncResponse & {
        data?: {
            balance: number;
        };
    }>;
    /**
     * Get token balance and recent transactions.
     */
    getTokenBalance(userId: string): Promise<SyncResponse & {
        data?: {
            balance: number;
            lastUpdated: string;
            transactions: Array<{
                action: string;
                amount: number;
                reason: string;
                created_at: string;
            }>;
        };
    }>;
    /**
     * Report session status.
     */
    reportStatus(userId: string, status: 'started' | 'active' | 'completed' | 'error', sessionId?: string, model?: string, error?: string, metadata?: Record<string, unknown>): Promise<SyncResponse>;
    /**
     * Get active sessions and status.
     */
    getStatus(userId?: string): Promise<SyncResponse & {
        data?: {
            sessions: Array<{
                user_id: string;
                status: string;
                session_id: string;
                model: string;
                created_at: string;
            }>;
            activeCount: number;
        };
    }>;
    /**
     * Subscribe to real-time updates via Server-Sent Events.
     * Returns an unsubscribe function.
     */
    subscribeToRealtime(userId: string, callback: RealtimeCallback, events?: string[]): () => void;
    /**
     * Create an EventSource for real-time updates (browser only).
     */
    createRealtimeConnection(userId: string, events?: string[]): EventSource | null;
}
export declare function createPlaygroundSync(config: PlaygroundSyncConfig): PlaygroundSync;
export declare function getPlaygroundSync(): PlaygroundSync | null;
