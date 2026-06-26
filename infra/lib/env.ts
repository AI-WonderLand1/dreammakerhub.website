export const env = process.env as Record<string, string | undefined>

export function requireEnv(value: string | undefined, name: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const ALICE_API_KEY = requireEnv(process.env.ALICE_API_KEY, 'ALICE_API_KEY')
export const SIMPLE_RICK_API_KEY = requireEnv(process.env.SIMPLE_RICK_API_KEY, 'SIMPLE_RICK_API_KEY')
export const SPIRIT_GUIDE_API_KEY = requireEnv(process.env.SPIRIT_GUIDE_API_KEY, 'SPIRIT_GUIDE_API_KEY')
export const MONGODB_URI = requireEnv(process.env.MONGODB_URI, 'MONGODB_URI')
