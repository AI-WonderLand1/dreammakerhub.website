export const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const hashToken = (token: string): string => {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export const verifyToken = (token: string, hash: string): boolean => {
  return hashToken(token) === hash
}

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
