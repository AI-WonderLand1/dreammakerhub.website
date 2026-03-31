type CursorPayload = {
  userId: string
  line: number
  column: number
}

type EngineCallback = (cursor: CursorPayload) => void

const rooms = new Map<string, Set<CollaborationEngine>>()

export class CollaborationEngine {
  public onCursorMove?: EngineCallback

  constructor(
    private readonly projectId: string,
    private readonly userId: string,
  ) {}

  async connect(): Promise<void> {
    if (!rooms.has(this.projectId)) {
      rooms.set(this.projectId, new Set())
    }
    rooms.get(this.projectId)!.add(this)
  }

  disconnect(): void {
    const room = rooms.get(this.projectId)
    room?.delete(this)
    if (room && room.size === 0) {
      rooms.delete(this.projectId)
    }
  }

  sendCursor(line: number, column: number): void {
    const room = rooms.get(this.projectId)
    if (!room) return

    const payload: CursorPayload = {
      userId: this.userId,
      line,
      column,
    }

    for (const peer of room) {
      if (peer === this) continue
      peer.onCursorMove?.(payload)
    }
  }
}
