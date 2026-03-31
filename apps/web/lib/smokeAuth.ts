import { randomUUID } from 'node:crypto'

export const smokeAuth = {
  validateToken: async (token: string): Promise<boolean> => {
    return Boolean(token)
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smoke_auth_token')
    }
    return null
  },

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smoke_auth_token', token)
    }
  },
}

export function isSmokeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SMOKE_MODE === 'true'
}

export function issueSmokeToken(userId: string): string {
  return `smoke-${userId}-${randomUUID()}`
}

export function getSmokeUserIdFromRequest(req: Request): string | undefined {
  const existing = req.headers.get('x-smoke-user-id')
  if (existing) return existing

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer smoke-')) {
    return authHeader.replace('Bearer ', '')
  }

  if (process.env.NEXT_PUBLIC_SMOKE_MODE === 'true') {
    return `smoke-${randomUUID()}`
  }

  return undefined
}

export default smokeAuth
