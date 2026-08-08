import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { runTick } from '../core/tick'

const app = new Hono()

// POST /tick  { count?: number }
app.post('/tick', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const requestedCount = typeof body.count === 'number' ? body.count : 1
    const count = Math.min(Math.max(requestedCount, 1), 100)

    let lastResult
    for (let i = 0; i < count; i++) {
      lastResult = await runTick()
      if (lastResult.skipped) break
    }

    return c.json({ success: true, result: lastResult })
  } catch (err) {
    console.error('Tick error:', err)
    return c.json({ success: false, error: String(err) }, 500)
  }
})

const port = Number(process.env.PORT) || 3000
console.log(`NPC Sim API running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
