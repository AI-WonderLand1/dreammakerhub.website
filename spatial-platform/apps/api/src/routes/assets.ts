import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'
import { uploadFile } from '../storage.js'

export async function assetRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/assets/upload', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }

    const data = await req.file()
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' })
    }

    const buffer = await data.toBuffer()
    const key = `assets/${userId}/${Date.now()}_${data.filename}`
    const url = await uploadFile(key, buffer, data.mimetype)

    const asset = await queryOne<{ id: string; name: string; url: string }>(
      `INSERT INTO assets (id, name, url, type, owner_id)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       RETURNING id, name, url`,
      [data.filename, url, 'model', userId]
    )

    return reply.status(201).send(asset)
  })

  app.get<{ Params: { id: string } }>('/api/assets/:id', async (req, reply) => {
    const asset = await queryOne<Record<string, unknown>>(
      'SELECT * FROM assets WHERE id = $1',
      [req.params.id]
    )
    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' })
    }
    return asset
  })

  app.get('/api/assets', async (req) => {
    const q = req.query as { page?: string; pageSize?: string; type?: string; tag?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    let sql = 'SELECT * FROM assets WHERE 1=1'
    const params: unknown[] = []
    let idx = 1

    if (q.type) {
      sql += ` AND type = $${idx++}`
      params.push(q.type)
    }
    if (q.tag) {
      sql += ` AND $${idx++} = ANY(tags)`
      params.push(q.tag)
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (idx++) + ' OFFSET $' + idx
    params.push(pageSize, offset)

    const assets = await query(sql, params)

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM assets'
    )

    return {
      data: assets,
      total: parseInt(countResult?.count ?? '0', 10),
      page,
      pageSize,
    }
  })

  app.delete<{ Params: { id: string } }>('/api/assets/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const asset = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM assets WHERE id = $1',
      [req.params.id]
    )
    if (!asset) return reply.status(404).send({ error: 'Asset not found' })
    if (asset.owner_id !== userId) {
      return reply.status(403).send({ error: 'Not authorized' })
    }

    await query('DELETE FROM assets WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })
}
