import crypto from 'node:crypto'

const ALGO = 'aes-256-gcm'

function getKey() {
  const raw = process.env.SECRETS_ENCRYPTION_KEY ?? 'development-only-32-byte-secret-key'
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
