import { listHooks, type WebhookEvent } from './store'

type DispatchWebhookEventInput = {
  ownerId: string
  event: WebhookEvent | string
  projectId?: string
  data?: Record<string, unknown>
}

export async function dispatchWebhookEvent(input: DispatchWebhookEventInput) {
  const hooks = await listHooks(input.ownerId)
  const matching = hooks.filter((hook) => hook.active && hook.events.includes(input.event as WebhookEvent))

  // Local/dev-safe dispatcher: reports intended delivery without network side effects.
  return {
    delivered: 0,
    candidates: matching.length,
    skipped: matching.map((hook) => ({ hookId: hook.id, url: hook.url })),
    event: input.event,
    projectId: input.projectId ?? null,
  }
}
