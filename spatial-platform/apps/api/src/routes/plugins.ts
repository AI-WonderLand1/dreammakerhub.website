import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'

export async function pluginRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/plugins', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const body = req.body as Record<string, unknown>

    const plugin = await queryOne(
      `INSERT INTO plugins (id, name, version, description, author, engine, hooks, permissions,
        entry_point, assets_url, owner_id)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        String(body.name ?? 'Unnamed Plugin'),
        String(body.version ?? '1.0.0'),
        String(body.description ?? ''),
        String(body.author ?? userId),
        String(body.engine ?? 'babylon'),
        body.hooks ?? [],
        body.permissions ?? [],
        String(body.entryPoint ?? 'index.js'),
        String(body.assetsUrl ?? ''),
        userId,
      ]
    )

    return reply.status(201).send(plugin)
  })

  app.get('/api/plugins', async (req) => {
    const q = req.query as { engine?: string; page?: string; pageSize?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    let sql = 'SELECT * FROM plugins'
    const params: unknown[] = []

    if (q.engine) {
      sql += ' WHERE engine = $1'
      params.push(q.engine)
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(pageSize, offset)

    return query(sql, params)
  })

  app.get<{ Params: { id: string } }>('/api/plugins/:id', async (req, reply) => {
    const plugin = await queryOne('SELECT * FROM plugins WHERE id = $1', [req.params.id])
    if (!plugin) return reply.status(404).send({ error: 'Plugin not found' })
    return plugin
  })

  app.delete<{ Params: { id: string } }>('/api/plugins/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const plugin = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM plugins WHERE id = $1',
      [req.params.id]
    )
    if (!plugin) return reply.status(404).send({ error: 'Plugin not found' })
    if (plugin.owner_id !== userId) return reply.status(403).send({ error: 'Not authorized' })

    await query('DELETE FROM plugins WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })
}
