import { randomUUID } from 'node:crypto'

export type WebhookEvent =
  | 'project.created'
  | 'project.imported'
  | 'project.exported'
  | 'file.written'
  | 'snapshot.created'

export type WebhookRecord = {
  id: string
  ownerId: string
  url: string
  events: WebhookEvent[]
  secret: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const hooks = new Map<string, WebhookRecord[]>()

export async function listHooks(ownerId: string): Promise<WebhookRecord[]> {
  return hooks.get(ownerId) ?? []
}

export async function createHook(input: { ownerId: string; url: string; events: WebhookEvent[] }) {
  const now = new Date().toISOString()
  const record: WebhookRecord = {
    id: randomUUID(),
    ownerId: input.ownerId,
    url: input.url,
    events: input.events,
    secret: randomUUID().replace(/-/g, ''),
    active: true,
    createdAt: now,
    updatedAt: now,
  }

  const existing = hooks.get(input.ownerId) ?? []
  hooks.set(input.ownerId, [record, ...existing])
  return record
}

export async function deleteHook(ownerId: string, hookId: string) {
  const existing = hooks.get(ownerId) ?? []
  const filtered = existing.filter((hook) => hook.id !== hookId)
  hooks.set(ownerId, filtered)
  return filtered.length !== existing.length
}

export async function updateHookActive(ownerId: string, hookId: string, active: boolean) {
  const existing = hooks.get(ownerId) ?? []
  const target = existing.find((hook) => hook.id === hookId)
  if (!target) return null

  target.active = active
  target.updatedAt = new Date().toISOString()
  return target
}
