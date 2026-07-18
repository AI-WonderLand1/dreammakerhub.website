import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'

interface ApplyBody {
  name: string
  email: string
  position: string
  portfolioUrl?: string
  message?: string
}

export async function careerRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ApplyBody }>('/api/careers/apply', async (req, reply) => {
    const { name, email, position, portfolioUrl, message } = req.body

    if (!name || !email || !position) {
      return reply.status(400).send({ error: 'Name, email, and position are required' })
    }

    if (!email.includes('@')) {
      return reply.status(400).send({ error: 'Invalid email address' })
    }

    const application = await queryOne(
      `INSERT INTO job_applications (id, name, email, position, portfolio_url, message)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
       RETURNING id, name, email, position, status, created_at`,
      [name, email, position, portfolioUrl ?? null, message ?? '']
    )

    return reply.status(201).send({
      id: application?.id,
      name: application?.name,
      email: application?.email,
      position: application?.position,
      status: application?.status,
      createdAt: application?.created_at,
    })
  })
}
