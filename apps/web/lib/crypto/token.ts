import crypto from 'node:crypto'

/**
 * Generates a cryptographically secure random token.
 * Uses crypto.randomBytes instead of Math.random for security.
 */
export const generateToken = (): string => {
  // Generate 32 bytes (256 bits) of randomness, encode as base64url
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Creates a SHA-256 hash of a token for secure storage.
 * Uses HMAC with a secret derived from process.env for additional security.
 */
export const hashToken = (token: string): string => {
  const secret = process.env.TOKEN_HASH_SECRET || process.env.SECRETS_ENCRYPTION_KEY || 'fallback-secret-change-in-production'
  return crypto.createHmac('sha256', secret).update(token).digest('hex')
}

export const verifyToken = (token: string, hash: string): boolean => {
  return hashToken(token) === hash
}

/**
 * Creates a new API token with its hash for storage.
 * The raw token is returned once to the user and should never be stored.
 */
export function makeApiToken(prefix = 'wk'): { token: string; token_hash: string; prefix: string } {
  const raw = generateToken()
  const token = `${prefix}_${raw}`
  return {
    token,
    token_hash: hashToken(token),
    prefix,
  }
}

export default { generateToken, hashToken, verifyToken, makeApiToken }
