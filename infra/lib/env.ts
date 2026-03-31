export const env = process.env as Record<string, string | undefined>

export function requireEnv(value: string | undefined, name: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}
