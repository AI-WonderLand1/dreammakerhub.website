import crypto from 'node:crypto'

const SCRYPT_KEYLEN = 64
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('base64url')
}

function hashWithScrypt(input: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(input, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) => {
      if (err) reject(err)
      else resolve(key.toString('hex'))
    })
  })
}

export const hashToken = async (token: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await hashWithScrypt(token, salt)
  return `${salt}:${derivedKey}`
}

export const verifyToken = async (token: string, hash: string): Promise<boolean> => {
  const [salt, key] = hash.split(':')
  if (!salt || !key) return false
  const derivedKey = await hashWithScrypt(token, salt)
  return derivedKey === key
}

export async function makeApiToken(prefix = 'wk'): Promise<{ token: string; token_hash: string; prefix: string }> {
  const raw = generateToken()
  const token = `${prefix}_${raw}`
  return {
    token,
    token_hash: await hashToken(token),
    prefix,
  }
}

export { hashToken as createTokenHash, verifyToken as compareTokenHash }

export default { generateToken, hashToken, verifyToken, makeApiToken }
