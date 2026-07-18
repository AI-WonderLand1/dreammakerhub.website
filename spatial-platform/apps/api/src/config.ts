export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  host: process.env.HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',

  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',

  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://spatial:spatial@localhost:5432/spatial',
    poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost:9000',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    bucket: process.env.MINIO_BUCKET ?? 'spatial',
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },

  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  },
}
