import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type PresenceUserPayload } from './types';
import { useBuilderStore } from '../store';
import { logger } from '@/lib/logger';

export interface PresenceConfig {
  projectId: string;
  userId: string;
  userName: string;
  color: string;
  enabled?: boolean;
}

export class PresenceService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private channel: any = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private config: PresenceConfig | null = null;
  private users: Map<string, PresenceUserPayload> = new Map();
  private onUsersChanged: ((users: PresenceUserPayload[]) => void) | null = null;

  start(config: PresenceConfig): void {
    if (typeof window === 'undefined') return;
    this.config = config;
    if (config.enabled === false) return;

    this.connect();

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_SELECTED, (event) => {
        const { elementId } = event.payload as EventPayload<typeof EventNames.ELEMENT_SELECTED>;
        this.updatePresence({ selectedElementId: elementId });
      })
    );

    this.heartbeatInterval = setInterval(() => {
      this.updatePresence({});
    }, 15000);
  }

  private async connect(): Promise<void> {
    if (!this.config) return;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const room = `wonder:presence:${this.config.projectId}`;
      this.channel = supabase.channel(room, {
        config: { presence: { key: this.config.userId } },
      });

      this.channel
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel.presenceState();
          this.syncUsers(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          for (const p of newPresences) {
            if (p.userId !== this.config?.userId) {
              this.bus.emit(EventNames.PRESENCE_JOINED, p as PresenceUserPayload);
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          for (const p of leftPresences) {
            this.users.delete(p.userId);
            this.bus.emit(EventNames.PRESENCE_LEFT, { userId: p.userId });
          }
          this.notifyUsersChanged();
        });

      await this.channel.subscribe();
      await this.channel.track(this.buildPresencePayload());
      logger.info(`[Presence] Connected for ${this.config.userName}`);
    } catch (err) {
      logger.warn('[Presence] Failed to connect:', err);
    }
  }

  private buildPresencePayload(): PresenceUserPayload {
    return {
      userId: this.config!.userId,
      userName: this.config!.userName,
      color: this.config!.color,
      selectedElementId: useBuilderStore.getState().selectedId,
      lastActivity: Date.now(),
    };
  }

  private async updatePresence(partial: Partial<PresenceUserPayload>): Promise<void> {
    if (!this.channel) return;
    try {
      await this.channel.track({ ...this.buildPresencePayload(), ...partial });
    } catch {}
  }

  private syncUsers(state: any): void {
    this.users.clear();
    for (const [key, presences] of Object.entries(state)) {
      const presence = (presences as any[])[0] as PresenceUserPayload;
      if (presence) {
        this.users.set(presence.userId, presence);
      }
    }
    this.notifyUsersChanged();
    this.bus.emit(EventNames.PRESENCE_SYNC, {
      users: Array.from(this.users.values()),
    });
  }

  private notifyUsersChanged(): void {
    this.onUsersChanged?.(Array.from(this.users.values()));
  }

  setOnUsersChanged(cb: (users: PresenceUserPayload[]) => void): void {
    this.onUsersChanged = cb;
  }

  getUsers(): PresenceUserPayload[] {
    return Array.from(this.users.values());
  }

  getOtherUsers(): PresenceUserPayload[] {
    if (!this.config) return [];
    return Array.from(this.users.values()).filter((u) => u.userId !== this.config!.userId);
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.channel) {
      this.channel.untrack().catch(() => {});
      this.channel.unsubscribe().catch(() => {});
      this.channel = null;
    }
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.users.clear();
    this.config = null;
  }
}

export const presenceService = new PresenceService();
