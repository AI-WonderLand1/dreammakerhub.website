import { randomUUID } from 'node:crypto'

const isProduction = process.env.NODE_ENV === 'production'

export const smokeAuth = {
  validateToken: async (token: string): Promise<boolean> => {
    // SECURITY: Never allow smoke auth in production
    if (isProduction || process.env.NEXT_PUBLIC_SMOKE_MODE !== 'true') {
      return false
    }
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
  // SECURITY: Never enable smoke mode in production
  if (isProduction) return false
  return process.env.NEXT_PUBLIC_SMOKE_MODE === 'true'
}

export function issueSmokeToken(userId: string): string {
  if (isProduction) throw new Error("Smoke tokens cannot be issued in production")
  return `smoke-${userId}-${randomUUID()}`
}

export function getSmokeUserIdFromRequest(req: Request): string | undefined {
  // SECURITY: Never issue smoke users in production
  if (isProduction) return undefined

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
