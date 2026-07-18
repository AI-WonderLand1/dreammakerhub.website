import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '../db.js'

interface RegisterBody {
  username: string
  email: string
  password: string
}

interface LoginBody {
  email: string
  password: string
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterBody }>('/api/auth/register', async (req, reply) => {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'Username, email, and password are required' })
    }

    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' })
    }

    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )
    if (existing) {
      return reply.status(409).send({ error: 'User with this email or username already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await queryOne<{ id: string; username: string; email: string }>(
      `INSERT INTO users (id, username, email, password_hash)
       VALUES (gen_random_uuid()::text, $1, $2, $3)
       RETURNING id, username, email`,
      [username, email, passwordHash]
    )

    const token = app.jwt.sign({ id: user!.id, username: user!.username })

    reply.setCookie('spatial_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return reply.status(201).send({
      user: { id: user!.id, username: user!.username, email: user!.email },
      token,
    })
  })

  app.post<{ Body: LoginBody }>('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' })
    }

    const user = await queryOne<{
      id: string; username: string; email: string; password_hash: string; role: string
    }>(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [email]
    )
    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' })
    }

    const token = app.jwt.sign({ id: user.id, username: user.username })

    reply.setCookie('spatial_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return reply.send({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
    })
  })

  app.get('/api/auth/me', {
    preHandler: [app.authenticate],
  }, async (req) => {
    const { id } = req.user as { id: string }
    const user = await queryOne<{
      id: string; username: string; email: string; role: string; avatar_url: string | null; created_at: string
    }>(
      'SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    )
    if (!user) {
      throw { statusCode: 404, message: 'User not found' }
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    }
  })
}
