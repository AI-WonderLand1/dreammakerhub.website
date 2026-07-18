import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'

export async function marketplaceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/marketplace/listings', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const { assetId, price, currency = 'credits', tags = [] } = req.body as {
      assetId: string; price: number; currency?: string; tags?: string[]
    }

    if (!assetId || !price) {
      return reply.status(400).send({ error: 'assetId and price are required' })
    }

    const asset = await queryOne<{ owner_id: string; name: string; type: string }>(
      'SELECT owner_id, name, type FROM assets WHERE id = $1',
      [assetId]
    )
    if (!asset) return reply.status(404).send({ error: 'Asset not found' })
    if (asset.owner_id !== userId) {
      return reply.status(403).send({ error: 'You do not own this asset' })
    }

    const listing = await queryOne(
      `INSERT INTO marketplace_listings (id, asset_id, seller_id, price, currency, tags)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
       RETURNING *`,
      [assetId, userId, price, currency, tags]
    )

    return reply.status(201).send(listing)
  })

  app.get('/api/marketplace/listings', async (req) => {
    const q = req.query as {
      page?: string; pageSize?: string; assetType?: string; tag?: string; sortBy?: string
    }
    const page = parseInt(q.page ?? '1', 10)
    const pageSize = parseInt(q.pageSize ?? '20', 10)
    const offset = (page - 1) * pageSize

    let sql = `SELECT ml.*, a.name as asset_name, a.type as asset_type, a.thumbnail_url
               FROM marketplace_listings ml
               JOIN assets a ON a.id = ml.asset_id
               WHERE ml.status = 'active'`
    const params: unknown[] = []
    let idx = 1

    if (q.assetType) {
      sql += ` AND a.type = $${idx++}`
      params.push(q.assetType)
    }
    if (q.tag) {
      sql += ` AND $${idx++} = ANY(ml.tags)`
      params.push(q.tag)
    }

    const sortBy = q.sortBy === 'price' ? 'ml.price ASC' : 'ml.created_at DESC'
    sql += ` ORDER BY ${sortBy} LIMIT $${idx++} OFFSET $${idx}`
    params.push(pageSize, offset)

    const listings = await query(sql, params)
    return { data: listings, page, pageSize, hasMore: listings.length === pageSize }
  })

  app.get('/api/marketplace/listings/mine', {
    preHandler: [app.authenticate],
  }, async (req) => {
    const { id: userId } = req.user as { id: string }
    return query(
      `SELECT ml.*, a.name as asset_name, a.type as asset_type
       FROM marketplace_listings ml
       JOIN assets a ON a.id = ml.asset_id
       WHERE ml.seller_id = $1
       ORDER BY ml.created_at DESC`,
      [userId]
    )
  })

  app.get<{ Params: { id: string } }>('/api/marketplace/listings/:id', async (req, reply) => {
    const listing = await queryOne(
      `SELECT ml.*, a.name as asset_name, a.type as asset_type, a.thumbnail_url
       FROM marketplace_listings ml
       JOIN assets a ON a.id = ml.asset_id
       WHERE ml.id = $1`,
      [req.params.id]
    )
    if (!listing) return reply.status(404).send({ error: 'Listing not found' })
    return listing
  })

  app.post('/api/marketplace/purchases', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const { listingId } = req.body as { listingId: string }

    const listing = await queryOne<{
      id: string; asset_id: string; seller_id: string; price: number; currency: string; status: string
    }>(
      'SELECT * FROM marketplace_listings WHERE id = $1',
      [listingId]
    )
    if (!listing) return reply.status(404).send({ error: 'Listing not found' })
    if (listing.status !== 'active') return reply.status(400).send({ error: 'Listing is not active' })
    if (listing.seller_id === userId) return reply.status(400).send({ error: 'Cannot buy your own listing' })

    const purchase = await queryOne(
      `INSERT INTO purchases (id, listing_id, buyer_id, amount, currency)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       RETURNING *`,
      [listingId, userId, listing.price, listing.currency]
    )

    await query(
      "UPDATE marketplace_listings SET status = 'sold' WHERE id = $1",
      [listingId]
    )

    return reply.status(201).send(purchase)
  })

  app.get('/api/marketplace/purchases/mine', {
    preHandler: [app.authenticate],
  }, async (req) => {
    const { id: userId } = req.user as { id: string }
    return query(
      `SELECT p.*, ml.price, ml.currency, a.name as asset_name, a.url as asset_url
       FROM purchases p
       JOIN marketplace_listings ml ON ml.id = p.listing_id
       JOIN assets a ON a.id = ml.asset_id
       WHERE p.buyer_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    )
  })
}
