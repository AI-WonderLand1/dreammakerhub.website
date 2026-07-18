import { WebSocketTransport, type Transport, type MessageHandler, type TransportState } from './transport'
import { StateSynchronizer, type SyncMessage, type StateSnapshot } from './sync'
import type { Participant, SyncObject, SyncNPC } from '@spatial/core'

export interface RoomConfig {
  worldId: string
  userId: string
  username: string
  serverUrl: string
}

export class MultiplayerRoom {
  readonly worldId: string
  readonly userId: string
  readonly username: string

  private transport: Transport
  private sync: StateSynchronizer
  private config: RoomConfig
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private onParticipantsChange: ((participants: Participant[]) => void) | null = null
  private onSyncUpdate: ((snapshot: StateSnapshot) => void) | null = null
  private onChatMessage: ((userId: string, username: string, message: string) => void) | null = null

  constructor(config: RoomConfig) {
    this.config = config
    this.worldId = config.worldId
    this.userId = config.userId
    this.username = config.username
    this.transport = new WebSocketTransport()
    this.sync = new StateSynchronizer()
  }

  async connect(): Promise<void> {
    const url = `${this.config.serverUrl}/ws/room/${this.worldId}?userId=${this.userId}&username=${encodeURIComponent(this.username)}`
    await this.transport.connect(url)

    this.transport.onMessage(this.handleMessage)

    this.transport.onStateChange((state: TransportState) => {
      if (state === 'connected') {
        this.startHeartbeat()
      } else {
        this.stopHeartbeat()
      }
    })
  }

  private handleMessage: MessageHandler = (data) => {
    const msg = data as SyncMessage
    this.sync.applyMessage(msg)

    switch (msg.type) {
      case 'join':
      case 'leave':
        this.onParticipantsChange?.(this.sync.getParticipants())
        break

      case 'update':
      case 'state':
        this.onSyncUpdate?.(this.sync.getSnapshot())
        break

      case 'chat':
        this.onChatMessage?.(
          msg.userId ?? '',
          msg.username ?? '',
          msg.payload as string
        )
        break
    }
  }

  updateMyState(
    position: [number, number, number],
    rotation: [number, number, number],
    animation = 'idle'
  ): void {
    this.transport.send({
      type: 'update',
      userId: this.userId,
      payload: {
        position,
        rotation,
        animation,
      },
      timestamp: Date.now(),
    })
  }

  sendChat(message: string): void {
    this.transport.send({
      type: 'chat',
      userId: this.userId,
      username: this.username,
      payload: message,
      timestamp: Date.now(),
    })
  }

  onParticipantsChanged(handler: (participants: Participant[]) => void): void {
    this.onParticipantsChange = handler
  }

  onStateUpdate(handler: (snapshot: StateSnapshot) => void): void {
    this.onSyncUpdate = handler
  }

  onChat(handler: (userId: string, username: string, message: string) => void): void {
    this.onChatMessage = handler
  }

  getParticipants(): Participant[] {
    return this.sync.getParticipants()
  }

  getObjects(): SyncObject[] {
    return this.sync.getObjects()
  }

  getNPCs(): SyncNPC[] {
    return this.sync.getNPCs()
  }

  getState(): TransportState {
    return this.transport.state
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.transport.send({ type: 'ping', timestamp: Date.now() })
    }, 15000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    this.transport.send({
      type: 'leave',
      userId: this.userId,
      payload: {},
      timestamp: Date.now(),
    })
    this.transport.close()
    this.sync.clear()
  }
}
