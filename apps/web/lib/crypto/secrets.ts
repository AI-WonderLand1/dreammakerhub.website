import crypto from 'node:crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.SECRETS_ENCRYPTION_KEY
  
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECRETS_ENCRYPTION_KEY is required in production')
    }
    console.warn('WARNING: Using fallback encryption key in development. Set SECRETS_ENCRYPTION_KEY for production.')
    // Fallback only for development - should never reach here in production
    return crypto.createHash('sha256').update('dev-only-fallback-key-change-me').digest()
  }
  
  return crypto.createHash('sha256').update(raw).digest()
}

export function encryptSecret(plainText: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    secret_ciphertext: encrypted.toString('base64'),
    secret_iv: iv.toString('base64'),
    secret_tag: authTag.toString('base64'),
    secret_alg: ALGO,
  }
}
