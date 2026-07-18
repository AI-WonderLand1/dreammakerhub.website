import pg from 'pg'
import Redis from 'ioredis'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.poolSize,
})

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null
    return Math.min(times * 200, 2000)
  },
})

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query(text, params)
  return (result.rows[0] as T) ?? null
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1')
    await redis.ping()
    return true
  } catch {
    return false
  }
}
