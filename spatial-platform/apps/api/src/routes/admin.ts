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

async function audit(actorId: string, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>, ip?: string): Promise<void> {
  await query(
    `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, ip_address)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)`,
    [actorId, action, entityType, entityId ?? null, metadata ? JSON.stringify(metadata) : '{}', ip ?? null]
  )
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/admin/stats', { preHandler: [requireAdmin] }, async () => {
    const users = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users')
    const worlds = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM worlds')
    const assets = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM assets')
    const listings = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM marketplace_listings WHERE status = 'active'")
    const purchases = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM purchases')
    const worldsToday = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM worlds WHERE created_at >= NOW() - INTERVAL '24 hours'"
    )
    const usersToday = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'"
    )
    return {
      users: parseInt(users?.count ?? '0', 10),
      worlds: parseInt(worlds?.count ?? '0', 10),
      assets: parseInt(assets?.count ?? '0', 10),
      listings: parseInt(listings?.count ?? '0', 10),
      purchases: parseInt(purchases?.count ?? '0', 10),
      worldsToday: parseInt(worldsToday?.count ?? '0', 10),
      usersToday: parseInt(usersToday?.count ?? '0', 10),
    }
  })

  app.get('/api/admin/stats/timeline', { preHandler: [requireAdmin] }, async () => {
    const usersByDay = await query<{ date: string; count: string }>(
      `SELECT DATE(created_at) as date, COUNT(*)::text as count
       FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`
    )
    const worldsByDay = await query<{ date: string; count: string }>(
      `SELECT DATE(created_at) as date, COUNT(*)::text as count
       FROM worlds WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`
    )
    return { usersByDay, worldsByDay }
  })

  app.get('/api/admin/users', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string; search?: string; role?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize
    const search = q.search ?? ''

    let sql = `SELECT id, username, email, role, avatar_url, created_at, updated_at FROM users WHERE 1=1`
    const params: unknown[] = []
    let idx = 1

    if (search) {
      sql += ` AND (username ILIKE $${idx} OR email ILIKE $${idx})`
      params.push(`%${search}%`)
      idx++
    }
    if (q.role) {
      sql += ` AND role = $${idx}`
      params.push(q.role)
      idx++
    }

    const countSql = sql
    const dataSql = sql + ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`
    params.push(pageSize, offset)

    const users = await query<Record<string, unknown>>(dataSql, params)
    const count = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM (${countSql}) sub`,
      params.slice(0, -2)
    )

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

  app.get<{ Params: { id: string } }>('/api/admin/users/:id', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const user = await queryOne<Record<string, unknown>>(
      `SELECT id, username, email, role, avatar_url, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.params.id]
    )
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const worldCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM worlds WHERE owner_id = $1', [req.params.id])
    const assetCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM assets WHERE owner_id = $1', [req.params.id])

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      worldCount: parseInt(worldCount?.count ?? '0', 10),
      assetCount: parseInt(assetCount?.count ?? '0', 10),
    }
  })

  app.patch<{ Params: { id: string }; Body: { role?: string } }>('/api/admin/users/:id', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const actor = req.user as { id: string; username: string }
    const { id } = req.params
    const { role } = req.body

    if (!role) return reply.status(400).send({ error: 'Role is required' })
    if (!['user', 'moderator', 'admin'].includes(role)) return reply.status(400).send({ error: 'Invalid role' })

    const user = await queryOne<Record<string, unknown>>(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, username, email, role, avatar_url, created_at, updated_at`,
      [role, id]
    )
    if (!user) return reply.status(404).send({ error: 'User not found' })

    await audit(actor.id, 'user.role.change', 'user', id, { newRole: role, oldRole: user.role })
    const ip = req.ip

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
    const actor = req.user as { id: string }
    const existing = await queryOne<{ name: string }>('SELECT name FROM assets WHERE id = $1', [req.params.id])
    if (!existing) return reply.status(404).send({ error: 'Asset not found' })
    await query('DELETE FROM marketplace_listings WHERE asset_id = $1', [req.params.id])
    await query('DELETE FROM assets WHERE id = $1', [req.params.id])
    await audit(actor.id, 'asset.delete', 'asset', req.params.id, { name: existing.name })
    return reply.status(204).send()
  })

  app.get('/api/admin/worlds', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    const worlds = await query<Record<string, unknown>>(
      `SELECT w.*, u.username as owner_name FROM worlds w
       JOIN users u ON u.id = w.owner_id
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
        npcCount: w.npc_count,
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
    const actor = req.user as { id: string }
    const existing = await queryOne<{ name: string }>('SELECT name FROM worlds WHERE id = $1', [req.params.id])
    if (!existing) return reply.status(404).send({ error: 'World not found' })
    await query('DELETE FROM npcs WHERE world_id = $1', [req.params.id])
    await query('DELETE FROM worlds WHERE id = $1', [req.params.id])
    await audit(actor.id, 'world.delete', 'world', req.params.id, { name: existing.name })
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
    const actor = req.user as { id: string }
    const existing = await queryOne('SELECT id FROM marketplace_listings WHERE id = $1', [req.params.id])
    if (!existing) return reply.status(404).send({ error: 'Listing not found' })
    await query('DELETE FROM purchases WHERE listing_id = $1', [req.params.id])
    await query('DELETE FROM marketplace_listings WHERE id = $1', [req.params.id])
    await audit(actor.id, 'listing.delete', 'listing', req.params.id)
    return reply.status(204).send()
  })

  app.get('/api/admin/settings', { preHandler: [requireAdmin] }, async () => {
    const settings = await query<{ key: string; value: Record<string, unknown>; updated_at: string; updated_by: string | null }>(
      'SELECT key, value, updated_at, updated_by FROM settings ORDER BY key'
    )
    return {
      data: settings.map(s => ({
        key: s.key,
        value: s.value,
        updatedAt: s.updated_at,
        updatedBy: s.updated_by,
      })),
    }
  })

  app.put<{ Body: { key: string; value: Record<string, unknown> } }>('/api/admin/settings', {
    preHandler: [requireAdmin],
  }, async (req, reply) => {
    const actor = req.user as { id: string }
    const { key, value } = req.body
    if (!key) return reply.status(400).send({ error: 'Key is required' })

    await query(
      `INSERT INTO settings (key, value, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3`,
      [key, JSON.stringify(value), actor.id]
    )

    await audit(actor.id, 'settings.update', 'settings', key, { value })
    return { key, value }
  })

  app.get('/api/admin/logs', { preHandler: [requireAdmin] }, async (req) => {
    const q = req.query as { page?: string; pageSize?: string; action?: string }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '50', 10)
    const offset = (page - 1) * pageSize

    let sql = `SELECT al.*, u.username as actor_name
               FROM audit_logs al
               JOIN users u ON u.id = al.actor_id
               WHERE 1=1`
    const params: unknown[] = []
    let idx = 1

    if (q.action) {
      sql += ` AND al.action = $${idx}`
      params.push(q.action)
      idx++
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`
    params.push(pageSize, offset)

    const logs = await query<Record<string, unknown>>(sql, params)
    const total = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM audit_logs')

    return {
      data: logs.map(l => ({
        id: l.id,
        actorId: l.actor_id,
        actorName: l.actor_name,
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        metadata: l.metadata,
        ipAddress: l.ip_address,
        createdAt: l.created_at,
      })),
      total: parseInt(total?.count ?? '0', 10),
      page,
      pageSize,
    }
  })
}
