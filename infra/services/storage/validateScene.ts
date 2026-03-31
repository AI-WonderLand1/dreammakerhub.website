import { SceneSchema } from './sceneSchema'

type SceneEntity = {
  name?: unknown
  components?: Record<string, unknown>
}

type SceneJson = {
  entities?: unknown
}

export function validateScene(sceneJson: unknown) {
  if (!sceneJson || typeof sceneJson !== 'object') {
    throw new Error('Scene JSON must be an object')
  }

  const scene = sceneJson as SceneJson

  if (!Array.isArray(scene.entities)) {
    throw new Error("Scene must contain an 'entities' array")
  }

  for (const rawEntity of scene.entities) {
    const entity = rawEntity as SceneEntity

    if (!entity.name || typeof entity.name !== 'string') {
      throw new Error('Each entity must have a name')
    }

    if (!entity.components || typeof entity.components !== 'object') {
      throw new Error(`Entity '${entity.name}' must have components`)
    }

    for (const key of Object.keys(entity.components)) {
      if (!Object.prototype.hasOwnProperty.call(SceneSchema.components, key)) {
        throw new Error(`Unknown component '${key}' on entity '${entity.name}'`)
      }
    }
  }

  return true
}
