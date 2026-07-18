export type MessageHandler = (data: unknown) => void
export type TransportState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface Transport {
  readonly state: TransportState
  connect(url: string): Promise<void>
  send(data: unknown): void
  onMessage(handler: MessageHandler): void
  onStateChange(handler: (state: TransportState) => void): void
  close(): void
}

export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null
  private url: string = ''
  private messageHandlers: Set<MessageHandler> = new Set()
  private stateHandlers: Set<(state: TransportState) => void> = new Set()
  private _state: TransportState = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  get state(): TransportState {
    return this._state
  }

  private setState(state: TransportState): void {
    this._state = state
    for (const handler of this.stateHandlers) {
      handler(state)
    }
  }

  connect(url: string): Promise<void> {
    this.url = url
    this.setState('connecting')

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          this.setState('connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            for (const handler of this.messageHandlers) {
              handler(data)
            }
          } catch {
            // ignore malformed messages
          }
        }

        this.ws.onclose = () => {
          if (this._state === 'connected') {
            this.handleReconnect()
          } else {
            this.setState('disconnected')
          }
        }

        this.ws.onerror = () => {
          if (this._state === 'connecting') {
            reject(new Error(`WebSocket connection failed to ${url}`))
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.add(handler)
  }

  onStateChange(handler: (state: TransportState) => void): void {
    this.stateHandlers.add(handler)
  }

  close(): void {
    this.maxReconnectAttempts = 0
    this.ws?.close()
    this.ws = null
    this.setState('disconnected')
    this.messageHandlers.clear()
    this.stateHandlers.clear()
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('disconnected')
      return
    }

    this.setState('reconnecting')
    this.reconnectAttempts++

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    setTimeout(() => {
      if (this.url) {
        this.connect(this.url).catch(() => {})
      }
    }, delay)
  }
}
