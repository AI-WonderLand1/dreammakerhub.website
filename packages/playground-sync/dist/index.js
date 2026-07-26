"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaygroundSync = void 0;
exports.createPlaygroundSync = createPlaygroundSync;
exports.getPlaygroundSync = getPlaygroundSync;
const logger_1 = require("../../../lib/logger");
class PlaygroundSync {
    constructor(config) {
        this.config = {
            timeout: 10000,
            ...config,
        };
    }
    async request(path, method = 'POST', body) {
        const url = `${this.config.apiUrl}/api/sync${path}`;
        const headers = {
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
        }
        catch (error) {
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
    async trackUsage(userId, tokens, model, sessionId, metadata) {
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
    async getUsage(userId) {
        return this.request(`/playground-usage?userId=${userId}`, 'GET');
    }
    /**
     * Add tokens to a user's balance.
     */
    async addTokens(userId, amount, reason, transactionId) {
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
    async subtractTokens(userId, amount, reason, transactionId) {
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
    async setTokens(userId, amount, reason, transactionId) {
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
    async getTokenBalance(userId) {
        return this.request(`/playground-tokens?userId=${userId}`, 'GET');
    }
    /**
     * Report session status.
     */
    async reportStatus(userId, status, sessionId, model, error, metadata) {
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
    async getStatus(userId) {
        const params = userId ? `?userId=${userId}` : '';
        return this.request(`/playground-status${params}`, 'GET');
    }
    /**
     * Subscribe to real-time updates via Server-Sent Events.
     * Returns an unsubscribe function.
     */
    subscribeToRealtime(userId, callback, events = ['usage', 'tokens', 'status']) {
        const params = new URLSearchParams({ userId, events: events.join(',') });
        const url = `${this.config.apiUrl}/api/sync/realtime?${params.toString()}`;
        const eventSource = new EventSource(url, {
            withCredentials: false,
        });
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                callback(data);
            }
            catch (e) {
                logger_1.logger.error('Failed to parse realtime event:', e);
            }
        };
        eventSource.onerror = (error) => {
            logger_1.logger.error('Realtime connection error:', error);
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
    createRealtimeConnection(userId, events = ['usage', 'tokens', 'status']) {
        if (typeof EventSource === 'undefined') {
            logger_1.logger.warn('EventSource not supported in this environment');
            return null;
        }
        const params = new URLSearchParams({ userId, events: events.join(',') });
        const url = `${this.config.apiUrl}/api/sync/realtime?${params.toString()}`;
        return new EventSource(url, {
            withCredentials: false,
        });
    }
}
exports.PlaygroundSync = PlaygroundSync;
// Export a factory function for easy setup
function createPlaygroundSync(config) {
    return new PlaygroundSync(config);
}
// Export default instance if environment variables are set
let defaultInstance = null;
function getPlaygroundSync() {
    if (defaultInstance)
        return defaultInstance;
    const apiUrl = process.env.DREAMMAKERHUB_API_URL || process.env.NEXT_PUBLIC_APP_URL;
    const syncKey = process.env.PLAYGROUND_SYNC_KEY;
    if (!apiUrl || !syncKey)
        return null;
    defaultInstance = new PlaygroundSync({ apiUrl, syncKey });
    return defaultInstance;
}
