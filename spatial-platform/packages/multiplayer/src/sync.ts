import type { SyncObject, SyncNPC, Participant } from '@spatial/core'

export interface SyncMessage {
  type: 'join' | 'leave' | 'update' | 'state' | 'chat' | 'npc_dialogue'
  userId?: string
  username?: string
  roomId?: string
  payload: unknown
  timestamp: number
}

export interface StateSnapshot {
  participants: Participant[]
  objects: SyncObject[]
  npcs: SyncNPC[]
  timestamp: number
}

export class StateSynchronizer {
  private participants: Map<string, Participant> = new Map()
  private objects: Map<string, SyncObject> = new Map()
  private npcs: Map<string, SyncNPC> = new Map()

  applyMessage(msg: SyncMessage): void {
    switch (msg.type) {
      case 'join':
        if (msg.userId && msg.username) {
          this.participants.set(msg.userId, {
            userId: msg.userId,
            username: msg.username,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            animation: 'idle',
            connectedAt: new Date(msg.timestamp).toISOString(),
          })
        }
        break

      case 'leave':
        if (msg.userId) {
          this.participants.delete(msg.userId)
        }
        break

      case 'update':
        this.applyUpdate(msg.payload as Partial<StateSnapshot>)
        break

      case 'state':
        this.applyFullState(msg.payload as StateSnapshot)
        break
    }
  }

  private applyUpdate(update: Partial<StateSnapshot>): void {
    if (update.participants) {
      for (const p of update.participants) {
        this.participants.set(p.userId, p)
      }
    }
    if (update.objects) {
      for (const obj of update.objects) {
        this.objects.set(obj.id, obj)
      }
    }
    if (update.npcs) {
      for (const npc of update.npcs) {
        this.npcs.set(npc.id, npc)
      }
    }
  }

  private applyFullState(state: StateSnapshot): void {
    this.participants.clear()
    this.objects.clear()
    this.npcs.clear()

    for (const p of state.participants) {
      this.participants.set(p.userId, p)
    }
    for (const obj of state.objects) {
      this.objects.set(obj.id, obj)
    }
    for (const npc of state.npcs) {
      this.npcs.set(npc.id, npc)
    }
  }

  getParticipants(): Participant[] {
    return Array.from(this.participants.values())
  }

  getObjects(): SyncObject[] {
    return Array.from(this.objects.values())
  }

  getNPCs(): SyncNPC[] {
    return Array.from(this.npcs.values())
  }

  getSnapshot(): StateSnapshot {
    return {
      participants: this.getParticipants(),
      objects: this.getObjects(),
      npcs: this.getNPCs(),
      timestamp: Date.now(),
    }
  }

  clear(): void {
    this.participants.clear()
    this.objects.clear()
    this.npcs.clear()
  }
}
