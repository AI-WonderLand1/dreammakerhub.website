import crypto from 'node:crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.SECRETS_ENCRYPTION_KEY
  
  if (!raw) {
    throw new Error('SECRETS_ENCRYPTION_KEY is required')
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

export function decryptSecret(ciphertext: string, iv: string, tag: string) {
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}
