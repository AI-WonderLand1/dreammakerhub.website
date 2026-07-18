import type { FastifyInstance } from 'fastify'
import { query, queryOne } from '../db.js'

export async function aiNPCRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/ai-npc/npcs', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const body = req.body as Record<string, unknown>

    const config = {
      name: String(body.name ?? 'NPC'),
      world_id: String(body.worldId),
      model_url: String(body.modelUrl ?? ''),
      position: body.position ?? [0, 0, 0],
      rotation: body.rotation ?? [0, 0, 0],
      personality: String(body.personality ?? 'Friendly'),
      llm_provider: String(body.llmProvider ?? 'openai'),
      llm_model: String(body.llmModel ?? 'gpt-4o-mini'),
      system_prompt: String(body.systemPrompt ?? 'You are a helpful NPC in a 3D world.'),
      knowledge_base: body.knowledgeBase ?? [],
      memory_size: parseInt(String(body.memorySize ?? '100'), 10),
      interaction_radius: parseFloat(String(body.interactionRadius ?? '10')),
      voice_enabled: Boolean(body.voiceEnabled),
    }

    const npc = await queryOne(
      `INSERT INTO npcs (id, name, world_id, model_url, position, rotation, personality,
        llm_provider, llm_model, system_prompt, knowledge_base, memory_size,
        interaction_radius, voice_enabled, owner_id)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        config.name, config.world_id, config.model_url,
        JSON.stringify(config.position), JSON.stringify(config.rotation),
        config.personality, config.llm_provider, config.llm_model,
        config.system_prompt, JSON.stringify(config.knowledge_base),
        config.memory_size, config.interaction_radius, config.voice_enabled, userId,
      ]
    )

    return reply.status(201).send(npc)
  })

  app.get('/api/ai-npc/npcs', async (req) => {
    const q = req.query as { worldId?: string }
    if (q.worldId) {
      return query('SELECT * FROM npcs WHERE world_id = $1', [q.worldId])
    }
    return query('SELECT * FROM npcs LIMIT 50')
  })

  app.get<{ Params: { id: string } }>('/api/ai-npc/npcs/:id', async (req, reply) => {
    const npc = await queryOne('SELECT * FROM npcs WHERE id = $1', [req.params.id])
    if (!npc) return reply.status(404).send({ error: 'NPC not found' })
    return npc
  })

  app.put<{ Params: { id: string } }>('/api/ai-npc/npcs/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const npc = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM npcs WHERE id = $1',
      [req.params.id]
    )
    if (!npc) return reply.status(404).send({ error: 'NPC not found' })
    if (npc.owner_id !== userId) return reply.status(403).send({ error: 'Not authorized' })

    const body = req.body as Record<string, unknown>
    const updates: string[] = []
    const values: unknown[] = []
    let idx = 1

    const fields = ['name', 'personality', 'system_prompt', 'llm_provider', 'llm_model',
      'memory_size', 'interaction_radius', 'voice_enabled', 'model_url']
    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`)
        values.push(body[field])
      }
    }
    if (body.position) {
      updates.push(`position = $${idx++}`)
      values.push(JSON.stringify(body.position))
    }
    if (body.rotation) {
      updates.push(`rotation = $${idx++}`)
      values.push(JSON.stringify(body.rotation))
    }
    if (body.knowledgeBase) {
      updates.push(`knowledge_base = $${idx++}`)
      values.push(JSON.stringify(body.knowledgeBase))
    }

    if (updates.length === 0) return reply.status(400).send({ error: 'No fields to update' })

    values.push(req.params.id)
    const updated = await queryOne(
      `UPDATE npcs SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    return updated
  })

  app.delete<{ Params: { id: string } }>('/api/ai-npc/npcs/:id', {
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { id: userId } = req.user as { id: string }
    const npc = await queryOne<{ owner_id: string }>(
      'SELECT owner_id FROM npcs WHERE id = $1',
      [req.params.id]
    )
    if (!npc) return reply.status(404).send({ error: 'NPC not found' })
    if (npc.owner_id !== userId) return reply.status(403).send({ error: 'Not authorized' })

    await query('DELETE FROM npcs WHERE id = $1', [req.params.id])
    return reply.status(204).send()
  })
}
