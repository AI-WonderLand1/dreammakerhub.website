import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'

async function requireAdmin(req: any, reply: any): Promise<void> {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
  if (req.user.role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' })
  }
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/admin/stats', { preHandler: [requireAdmin] }, async () => {
    const users = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users')
    const worlds = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM worlds')
    const assets = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM assets')
    const listings = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM marketplace_listings WHERE status = 'active'")
    const purchases = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM purchases')
    return {
      users: parseInt(users?.count ?? '0', 10),
      worlds: parseInt(worlds?.count ?? '0', 10),
      assets: parseInt(assets?.count ?? '0', 10),
      listings: parseInt(listings?.count ?? '0', 10),
      purchases: parseInt(purchases?.count ?? '0', 10),
    }
  })

  app.get('/api/admin/users', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string; search?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize
    const search = q.search ?? ''

    let sql = 'SELECT id, username, email, role, avatar_url, created_at, updated_at FROM users'
    const params: unknown[] = []

    if (search) {
      sql += ' WHERE username ILIKE $1 OR email ILIKE $1'
      params.push(`%${search}%`)
    }

    const countSql = search
      ? `SELECT COUNT(*) as count FROM users WHERE username ILIKE $1 OR email ILIKE $1`
      : 'SELECT COUNT(*) as count FROM users'

    sql += ' ORDER BY created_at DESC'
    const idx = params.length + 1
    sql += ` LIMIT $${idx} OFFSET $${idx + 1}`
    params.push(pageSize, offset)

    const users = await query<Record<string, unknown>>(sql, params)
    const count = await queryOne<{ count: string }>(countSql, search ? [`%${search}%`] : [])

    return {
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatar_url,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
      total: parseInt(count?.count ?? '0', 10),
      page,
      pageSize,
    }
  })

  app.patch<{ Params: { id: string }; Body: { role?: string } }>('/api/admin/users/:id', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const { id } = req.params
    const { role } = req.body

    if (!role) {
      return reply.status(400).send({ error: 'Role is required' })
    }
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return reply.status(400).send({ error: 'Invalid role' })
    }

    const user = await queryOne<Record<string, unknown>>(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role, avatar_url, created_at, updated_at`,
      [role, id]
    )
    if (!user) return reply.status(404).send({ error: 'User not found' })

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  })

  app.get('/api/admin/assets', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string; type?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    let sql = `SELECT a.*, u.username as owner_name FROM assets a JOIN users u ON u.id = a.owner_id`
    const params: unknown[] = []

    if (q.type) {
      sql += ' WHERE a.type = $1'
      params.push(q.type)
    }

    sql += ' ORDER BY a.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(pageSize, offset)

    const assets = await query<Record<string, unknown>>(sql, params)
    const total = q.type
      ? await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM assets WHERE type = $1', [q.type])
      : await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM assets')

    return {
      data: assets.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        type: a.type,
        url: a.url,
        thumbnailUrl: a.thumbnail_url,
        ownerId: a.owner_id,
        ownerName: a.owner_name,
        price: a.price,
        tags: a.tags,
        downloadCount: a.download_count,
        createdAt: a.created_at,
      })),
      total: parseInt(total?.count ?? '0', 10),
      page,
      pageSize,
    }
  })

  app.delete<{ Params: { id: string } }>('/api/admin/assets/:id', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const existing = await queryOne('SELECT id FROM assets WHERE id = $1', [req.params.id])
    if (!existing) return reply.status(404).send({ error: 'Asset not found' })
    await query('DELETE FROM marketplace_listings WHERE asset_id = $1', [req.params.id])
    await query('DELETE FROM assets WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })

  app.get('/api/admin/worlds', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    const worlds = await query<Record<string, unknown>>(
      `SELECT w.*, u.username as owner_name FROM worlds w JOIN users u ON u.id = w.owner_id
       ORDER BY w.created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    const total = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM worlds')

    return {
      data: worlds.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        visibility: w.visibility,
        thumbnailUrl: w.thumbnail_url,
        ownerId: w.owner_id,
        ownerName: w.owner_name,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      })),
      total: parseInt(total?.count ?? '0', 10),
      page,
      pageSize,
    }
  })

  app.delete<{ Params: { id: string } }>('/api/admin/worlds/:id', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const existing = await queryOne('SELECT id FROM worlds WHERE id = $1', [req.params.id])
    if (!existing) return reply.status(404).send({ error: 'World not found' })
    await query('DELETE FROM npcs WHERE world_id = $1', [req.params.id])
    await query('DELETE FROM worlds WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })

  app.get('/api/admin/listings', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    const listings = await query<Record<string, unknown>>(
      `SELECT ml.*, a.name as asset_name, a.type as asset_type, u.username as seller_name
       FROM marketplace_listings ml
       JOIN assets a ON a.id = ml.asset_id
       JOIN users u ON u.id = ml.seller_id
       ORDER BY ml.created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    const total = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM marketplace_listings')

    return {
      data: listings.map(l => ({
        id: l.id,
        assetId: l.asset_id,
        assetName: l.asset_name,
        assetType: l.asset_type,
        sellerId: l.seller_id,
        sellerName: l.seller_name,
        price: l.price,
        currency: l.currency,
        status: l.status,
        tags: l.tags,
        createdAt: l.created_at,
      })),
      total: parseInt(total?.count ?? '0', 10),
      page,
      pageSize,
    }
  })

  app.delete<{ Params: { id: string } }>('/api/admin/listings/:id', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const existing = await queryOne('SELECT id FROM marketplace_listings WHERE id = $1', [req.params.id])
    if (!existing) return reply.status(404).send({ error: 'Listing not found' })
    await query('DELETE FROM purchases WHERE listing_id = $1', [req.params.id])
    await query('DELETE FROM marketplace_listings WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })
}
