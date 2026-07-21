import type { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import { query, queryOne } from '../db.js'
import { uploadFile } from '../storage.js'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

const ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, maxRequests: number, windowMs: number): void {
  const now = Date.now()
  const entry = RATE_LIMIT_MAP.get(key)
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (entry.count >= maxRequests) {
    throw Object.assign(new Error('Too many requests'), { statusCode: 429 })
  }
  entry.count++
}

function validateUploadId(id: string, field: string): string {
  if (!ID_REGEX.test(id)) {
    throw Object.assign(new Error(`Invalid ${field}: must be 1-64 alphanumeric, hyphen, or underscore`), { statusCode: 400 })
  }
  return id
}

export async function streamingRoutes(app: FastifyInstance): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  app.post('/api/video/upload', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No file provided' })

    rateLimit(`upload:${userId}`, 10, 60_000)

    const buffer = await data.toBuffer()
    const key = `videos/${userId}/${Date.now()}_${data.filename}`
    const url = await uploadFile(key, buffer, data.mimetype)

    const video = await queryOne(
      `INSERT INTO videos (id, user_id, title, filename, size_bytes, status, hls_url)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'ready', $5)
       RETURNING *`,
      [userId, data.filename, data.filename, buffer.length, url]
    )

    return reply.status(201).send(video)
  })

  app.post('/api/video/upload/chunk', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No chunk provided' })

    rateLimit(`chunk:${userId}`, 100, 60_000)

    const rawUploadId = String(data.fields.uploadId?.value ?? '')
    const uploadId = validateUploadId(rawUploadId, 'uploadId')
    const rawChunkIndex = String(data.fields.chunkIndex?.value ?? '')
    if (!/^\d+$/.test(rawChunkIndex)) {
      return reply.status(400).send({ error: 'Invalid chunkIndex' })
    }
    const chunkIndex = parseInt(rawChunkIndex, 10)

    const chunkDir = path.join(UPLOAD_DIR, 'chunks', uploadId)
    await fs.mkdir(chunkDir, { recursive: true })

    const buffer = await data.toBuffer()
    const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`)
    await fs.writeFile(chunkPath, buffer)

    return { received: chunkIndex, total: parseInt(String(data.fields.totalChunks?.value ?? '1'), 10) }
  })

  app.post('/api/video/upload/complete', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const body = req.body as Record<string, unknown>
    const uploadId = validateUploadId(String(body.uploadId ?? ''), 'uploadId')

    rateLimit(`complete:${userId}`, 10, 60_000)

    const chunkDir = path.join(UPLOAD_DIR, 'chunks', uploadId)
    let files: string[]
    try {
      files = await fs.readdir(chunkDir)
    } catch {
      return reply.status(400).send({ error: 'No chunks found for this upload. Did you upload any chunks?' })
    }
    const chunkFiles = files.filter(f => /^chunk_\d+$/.test(f))
    chunkFiles.sort((a, b) => {
      const ai = parseInt(a.split('_')[1], 10)
      const bi = parseInt(b.split('_')[1], 10)
      return ai - bi
    })

    const chunks = await Promise.all(
      chunkFiles.map(f => fs.readFile(path.join(chunkDir, f)))
    )
    const buffer = Buffer.concat(chunks)

    const filename = String(body.filename ?? 'video.mp4').replace(/[/\\]/g, '_')
    const key = `videos/${userId}/${Date.now()}_${filename}`
    const url = await uploadFile(key, buffer, 'video/mp4')

    await fs.rm(chunkDir, { recursive: true, force: true })

    const video = await queryOne(
      `INSERT INTO videos (id, user_id, title, filename, size_bytes, status, hls_url)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'processing', $5)
       RETURNING *`,
      [userId, filename, filename, buffer.length, url]
    )

    return reply.status(201).send(video)
  })

  app.get('/api/video/mine', {
    preHandler: [app.authenticate],
  }, async (req) => {
    const { id: userId } = req.user as { id: string }
    return query('SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  })

  app.get<{ Params: { id: string } }>('/api/video/:id', async (req, reply) => {
    const video = await queryOne('SELECT * FROM videos WHERE id = $1', [req.params.id])
    if (!video) return reply.status(404).send({ error: 'Video not found' })
    return video
  })

  app.delete<{ Params: { id: string } }>('/api/video/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const video = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM videos WHERE id = $1',
      [req.params.id]
    )
    if (!video) return reply.status(404).send({ error: 'Video not found' })
    if (video.user_id !== userId) return reply.status(403).send({ error: 'Not authorized' })

    await query('DELETE FROM videos WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })

  app.get<{ Params: { id: string } }>('/api/video/:id/hls/:file', async (req, reply) => {
    const video = await queryOne<{ hls_url: string }>(
      'SELECT hls_url FROM videos WHERE id = $1',
      [req.params.id]
    )
    if (!video?.hls_url) return reply.status(404).send({ error: 'HLS not available' })
    return reply.redirect(video.hls_url)
  })
}
