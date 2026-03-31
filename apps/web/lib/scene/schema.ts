export interface SceneFile {
  id: string
  workspaceId: string

  metadata: {
    name: string
    createdAt: number
    updatedAt: number
  }

  objects: SceneObject[]
  materials: SceneMaterial[]
  lights: SceneLight[]
  camera: SceneCamera
  skybox?: SceneSkybox
}

export interface SceneObject {
  id: string
  name: string
  meshUrl: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  material?: string
}

export interface SceneMaterial {
  id: string
  albedoMap?: string
  normalMap?: string
  emissiveMap?: string
  color?: [number, number, number]
}

export interface SceneLight {
  id: string
  type: "directional" | "point" | "spot"
  color: [number, number, number]
  intensity: number
  direction?: [number, number, number]
  position?: [number, number, number]
}

export interface SceneCamera {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export interface SceneSkybox {
  type: "equirect"
  url: string
}

