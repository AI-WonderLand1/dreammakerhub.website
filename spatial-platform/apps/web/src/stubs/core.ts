export interface SceneObject {
  id: string
  name: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  meshUrl: string | null
  material: {
    color: [number, number, number]
    metallic: number
    roughness: number
    emissive: [number, number, number] | null
    opacity: number
  }
  physics: unknown
  scripts: string[]
  children: unknown[]
}

export type SceneData = Record<string, unknown>

export interface World {
  id: string
  name: string
  sceneData: SceneData
}
