import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'

interface RoomState {
  participants: Map<string, {
    userId: string
    username: string
    position: [number, number, number]
    rotation: [number, number, number]
    animation: string
    connectedAt: number
  }>
}

const rooms = new Map<string, RoomState>()
const userSockets = new Map<string, Set<WebSocket>>()

function getOrCreateRoom(worldId: string): RoomState {
  let room = rooms.get(worldId)
  if (!room) {
    room = { participants: new Map() }
    rooms.set(worldId, room)
  }
  return room
}

export async function multiplayerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws/room/:worldId', { websocket: true }, (socket, req) => {
    const { worldId } = req.params as { worldId: string }
    const url = new URL(req.url, `http://${req.headers.host}`)
    const userId = url.searchParams.get('userId') ?? randomUUID()
    const username = url.searchParams.get('username') ?? 'Anonymous'

    const room = getOrCreateRoom(worldId)
    room.participants.set(userId, {
      userId,
      username,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      animation: 'idle',
      connectedAt: Date.now(),
    })

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set())
    }
    userSockets.get(userId)!.add(socket)

    const joinMsg = JSON.stringify({
      type: 'join', userId, username, worldId,
      payload: { participants: Array.from(room.participants.values()) },
      timestamp: Date.now(),
    })
    broadcastToRoom(worldId, joinMsg, socket)

    socket.send(JSON.stringify({
      type: 'state',
      payload: {
        participants: Array.from(room.participants.values()),
        objects: [],
        npcs: [],
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }))

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        const now = Date.now()

        switch (msg.type) {
          case 'update': {
            const participant = room.participants.get(userId)
            if (participant && msg.payload) {
              if (msg.payload.position) participant.position = msg.payload.position
              if (msg.payload.rotation) participant.rotation = msg.payload.rotation
              if (msg.payload.animation) participant.animation = msg.payload.animation
            }
            const updateMsg = JSON.stringify({
              type: 'update',
              userId,
              payload: {
                participants: [{ userId, username, ...msg.payload }],
              },
              timestamp: now,
            })
            broadcastToRoom(worldId, updateMsg, socket)
            break
          }
          case 'chat': {
            const chatMsg = JSON.stringify({
              type: 'chat', userId, username,
              payload: msg.payload,
              timestamp: now,
            })
            broadcastToRoom(worldId, chatMsg)
            break
          }
          case 'ping': {
            socket.send(JSON.stringify({ type: 'pong', timestamp: now }))
            break
          }
        }
      } catch {
        // ignore malformed messages
      }
    })

    socket.on('close', () => {
      room.participants.delete(userId)
      userSockets.get(userId)?.delete(socket)
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId)
      }

      const leaveMsg = JSON.stringify({
        type: 'leave', userId, username,
        payload: { participants: Array.from(room.participants.values()) },
        timestamp: Date.now(),
      })
      broadcastToRoom(worldId, leaveMsg)

      if (room.participants.size === 0) {
        rooms.delete(worldId)
      }
    })
  })
}

function broadcastToRoom(worldId: string, message: string, exclude?: WebSocket): void {
  const room = rooms.get(worldId)
  if (!room) return

  for (const [pid] of room.participants) {
    const sockets = userSockets.get(pid)
    if (!sockets) continue
    for (const sock of sockets) {
      if (sock !== exclude && sock.readyState === sock.OPEN) {
        sock.send(message)
      }
    }
  }
}
