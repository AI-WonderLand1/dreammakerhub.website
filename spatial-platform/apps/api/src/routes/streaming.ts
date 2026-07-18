import type { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs/promises'
import { query, queryOne } from '../db.js'
import { uploadFile } from '../storage.js'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function streamingRoutes(app: FastifyInstance): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  app.post('/api/video/upload', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No file provided' })

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
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No chunk provided' })

    const rawUploadId = String(data.fields.uploadId?.value ?? 'unknown')
    const uploadId = rawUploadId.replace(/[^a-zA-Z0-9_-]/g, '')
    const chunkIndex = String(data.fields.chunkIndex?.value ?? '0')
    const totalChunks = String(data.fields.totalChunks?.value ?? '1')
    const filename = String(data.fields.filename?.value ?? 'video.mp4')

    const chunkDir = path.join(UPLOAD_DIR, 'chunks', uploadId)
    await fs.mkdir(chunkDir, { recursive: true })

    const buffer = await data.toBuffer()
    const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`)
    await fs.writeFile(chunkPath, buffer)

    return { received: parseInt(chunkIndex, 10), total: parseInt(totalChunks, 10), filename }
  })

  app.post('/api/video/upload/complete', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const { uploadId, filename } = req.body as { uploadId: string; filename: string }
    const safeId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '')

    const chunkDir = path.join(UPLOAD_DIR, 'chunks', safeId)
    let files: string[]
    try {
      files = await fs.readdir(chunkDir)
    } catch {
      return reply.status(400).send({ error: 'No chunks found for this upload. Did you upload any chunks?' })
    }
    files.sort((a, b) => {
      const ai = parseInt(a.split('_')[1], 10)
      const bi = parseInt(b.split('_')[1], 10)
      return ai - bi
    })

    const chunks = await Promise.all(
      files.map(f => fs.readFile(path.join(chunkDir, f)))
    )
    const buffer = Buffer.concat(chunks)

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
