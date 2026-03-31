type LogListener = (message: string) => void

const listeners = new Set<LogListener>()

export function subscribeLogs(listener: LogListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishLog(message: string) {
  for (const listener of listeners) {
    listener(message)
  }
}
