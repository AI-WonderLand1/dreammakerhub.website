import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import multipart from '@fastify/multipart'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'
import { config } from './config.js'
import { healthCheck } from './db.js'
import { ensureBucket } from './storage.js'
import { runMigrations } from './migrate.js'
import { authRoutes } from './routes/auth.js'
import { worldRoutes } from './routes/worlds.js'
import { assetRoutes } from './routes/assets.js'
import { marketplaceRoutes } from './routes/marketplace.js'
import { multiplayerRoutes } from './routes/multiplayer.js'
import { aiNPCRoutes } from './routes/ai-npc.js'
import { streamingRoutes } from './routes/streaming.js'
import { pluginRoutes } from './routes/plugins.js'
import { adminRoutes } from './routes/admin.js'

const app = Fastify({
  logger: config.nodeEnv === 'development',
  trustProxy: true,
})

// Decorate with authenticate
app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
})

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>
  }
}

async function start(): Promise<void> {
  await app.register(cors, { origin: config.cors.origin })
  await app.register(jwt, { secret: config.jwtSecret })
  await app.register(cookie)
  await app.register(websocket)
  await app.register(multipart, { limits: { fileSize: 500 * 1024 * 1024 } })
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  })

  // Routes
  await app.register(authRoutes)
  await app.register(worldRoutes)
  await app.register(assetRoutes)
  await app.register(marketplaceRoutes)
  await app.register(multiplayerRoutes)
  await app.register(aiNPCRoutes)
  await app.register(streamingRoutes)
  await app.register(pluginRoutes)
  await app.register(adminRoutes)

  // Health
  app.get('/api/health', async () => {
    const dbOk = await healthCheck()
    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    }
  })

  // Run migrations
  try {
    await runMigrations()
  } catch (err) {
    app.log.error('Migration failed, server may not function correctly')
  }

  // Init storage bucket
  try {
    await ensureBucket()
  } catch (err) {
    app.log.warn('Failed to ensure MinIO bucket (may not be available yet)')
  }

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`Server running on ${config.host}:${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
