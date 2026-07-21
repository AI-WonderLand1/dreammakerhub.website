import { supabaseRouteClient } from '@/lib/supabase/route'
import { logger } from '@/lib/logger';

export type MemoryWriteInput = {
  userId: string
  projectId: string
  traceId: string
  prompt: string
  response: string
  confessions: unknown
  persona: string
  aiLaws: readonly string[]
  language: string
}

export async function writeAiMemoryEntry(input: MemoryWriteInput) {
  const bucket = process.env.AI_MEMORY_BUCKET?.trim() || 'ai-memory'
  const date = new Date().toISOString().slice(0, 10)
  const path = `users/${input.userId}/projects/${input.projectId}/${date}/${input.traceId}.json`

  const payload = {
    createdAt: new Date().toISOString(),
    traceId: input.traceId,
    userId: input.userId,
    projectId: input.projectId,
    prompt: input.prompt,
    response: input.response,
    confessions: input.confessions,
    persona: input.persona,
    aiLaws: input.aiLaws,
    language: input.language,
  }

  const { error } = await supabaseRouteClient().storage.from(bucket).upload(path, JSON.stringify(payload), {
    contentType: 'application/json',
    upsert: true,
  })

  if (error) throw error

  return { bucket, path }
}
