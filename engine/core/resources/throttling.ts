import { spawn } from 'child_process'

interface ResourceLimits {
  cpuPercent: number
  memoryMB: number
  maxProcesses: number
  timeoutSeconds: number
}

export class ResourceMonitor {
  private sessions = new Map<string, any>()

  async createSession(sessionId: string, limits: ResourceLimits) {
    // Use Docker or systemd-run for resource limits
    const container = spawn('docker', [
      'run',
      '--rm',
      '--cpus', (limits.cpuPercent / 100).toString(),
      '--memory', `${limits.memoryMB}m`,
      '--pids-limit', limits.maxProcesses.toString(),
      '--name', `session-${sessionId}`,
      'node:20-alpine',
      'node', '-e', 'require("http").createServer().listen(3000)'
    ])

    this.sessions.set(sessionId, {
      container,
      limits,
      startTime: Date.now()
    })

    // Auto-kill after timeout
    setTimeout(() => {
      this.killSession(sessionId)
    }, limits.timeoutSeconds * 1000)

    return sessionId
  }

  async getUsage(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Get container stats
    const stats = await new Promise((resolve) => {
      const proc = spawn('docker', ['stats', `session-${sessionId}`, '--no-stream', '--format', '{{json .}}'])
      let output = ''
      proc.stdout.on('data', (data) => output += data)
      proc.on('close', () => resolve(JSON.parse(output)))
    })

    return stats
  }

  killSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    spawn('docker', ['stop', `session-${sessionId}`])
    this.sessions.delete(sessionId)
  }
}

export const resourceMonitor = new ResourceMonitor()
