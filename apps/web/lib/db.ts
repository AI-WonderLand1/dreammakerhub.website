import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

/**
 * Resolve the pg connection config from DATABASE_URL.
 *
 * Works with Supabase Postgres (direct or transaction pooler) and any other
 * Postgres provider. TLS is enabled automatically for remote hosts (Supabase
 * requires it); localhost is left plaintext for local dev.
 */
function buildConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Configure it with your Supabase Postgres connection string ' +
      '(e.g. postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres).',
    );
  }

  const isLocal = /localhost|127\.0\.0\.1|::1/.test(connectionString);
  const sslDisabled = process.env.DATABASE_SSL === 'disabled';

  return {
    connectionString,
    ssl: !isLocal && !sslDisabled ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 10_000),
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30_000),
  };
}

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool(buildConfig());
    pool.on('error', (err) => {
      console.error('[db] idle client error:', err.message);
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const db = getDb();
  return db.query(text, params);
}
