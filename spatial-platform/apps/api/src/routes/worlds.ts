import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'

interface CreateWorldBody {
  name: string
  description: string
  visibility?: 'public' | 'private' | 'unlisted'
}

interface UpdateWorldBody {
  name?: string
  description?: string
  visibility?: 'public' | 'private' | 'unlisted'
  sceneData?: Record<string, unknown>
  settings?: Record<string, unknown>
}

export async function worldRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateWorldBody }>('/api/worlds', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { name, description, visibility = 'public' } = req.body
    const { id: ownerId } = req.user as { id: string }

    if (!name) {
      return reply.status(400).send({ error: 'Name is required' })
    }

    const world = await queryOne<{ id: string; name: string }>(
      `INSERT INTO worlds (id, name, description, owner_id, visibility)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       RETURNING id, name`,
      [name, description, ownerId, visibility]
    )

    return reply.status(201).send(world)
  })

  app.get('/api/worlds', async (req) => {
    const query_params = req.query as { page?: string; pageSize?: string }
    const page = parseInt(query_params.page ?? '1', 10)
    const pageSize = parseInt(query_params.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    const worlds = await query<{
      id: string; name: string; description: string; visibility: string;
      thumbnail_url: string | null; owner_id: string; created_at: string
    }>(
      `SELECT id, name, description, visibility, thumbnail_url, owner_id, created_at
       FROM worlds WHERE visibility = 'public'
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    const count = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM worlds WHERE visibility = 'public'"
    )

    return {
      data: worlds.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        visibility: w.visibility,
        thumbnailUrl: w.thumbnail_url,
        ownerId: w.owner_id,
        createdAt: w.created_at,
      })),
      total: parseInt(count?.count ?? '0', 10),
      page,
      pageSize,
    }
  })

  app.get<{ Params: { id: string } }>('/api/worlds/:id', async (req, reply) => {
    const world = await queryOne<Record<string, unknown>>(
      'SELECT * FROM worlds WHERE id = $1',
      [req.params.id]
    )
    if (!world) {
      return reply.status(404).send({ error: 'World not found' })
    }
    return world
  })

  app.put<{ Params: { id: string }; Body: UpdateWorldBody }>('/api/worlds/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const world = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM worlds WHERE id = $1',
      [req.params.id]
    )
    if (!world) return reply.status(404).send({ error: 'World not found' })
    if (world.owner_id !== userId) {
      return reply.status(403).send({ error: 'Not authorized' })
    }

    const { name, description, visibility, sceneData, settings } = req.body
    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (name) { updates.push(`name = $${idx++}`); values.push(name) }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description) }
    if (visibility) { updates.push(`visibility = $${idx++}`); values.push(visibility) }
    if (sceneData) { updates.push(`scene_data = $${idx++}`); values.push(JSON.stringify(sceneData)) }
    if (settings) { updates.push(`settings = $${idx++}`); values.push(JSON.stringify(settings)) }

    if (updates.length === 0) {
      return reply.status(400).send({ error: 'No fields to update' })
    }

    updates.push(`updated_at = NOW()`)
    values.push(req.params.id)

    const updated = await queryOne(
      `UPDATE worlds SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    return updated
  })

  app.delete<{ Params: { id: string } }>('/api/worlds/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const world = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM worlds WHERE id = $1',
      [req.params.id]
    )
    if (!world) return reply.status(404).send({ error: 'World not found' })
    if (world.owner_id !== userId) {
      return reply.status(403).send({ error: 'Not authorized' })
    }

    await query('DELETE FROM worlds WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })
}
