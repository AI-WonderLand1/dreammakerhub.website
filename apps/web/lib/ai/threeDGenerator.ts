import type { SceneCamera, SceneLight, SceneMaterial, SceneObject, SceneSkybox } from '@/lib/scene/schema'

type GeneratedSceneDraft = {
  objects: SceneObject[]
  materials: SceneMaterial[]
  lights: SceneLight[]
  camera: SceneCamera
  skybox?: SceneSkybox
}

const baseCamera: SceneCamera = {
  position: [0, 5, 10],
  target: [0, 0, 0],
  fov: 60,
}

export function generate3DSceneDraft(prompt: string): GeneratedSceneDraft {
  const lower = prompt.toLowerCase()

  const defaultMaterial: SceneMaterial = {
    id: 'mat-default',
    color: [0.85, 0.85, 0.9],
  }

  const lights: SceneLight[] = [
    {
      id: 'light-key',
      type: 'directional',
      color: [1, 1, 1],
      intensity: 1.2,
      direction: [-1, -1, -0.3],
    },
  ]

  const objects: SceneObject[] = []
  const materials: SceneMaterial[] = [defaultMaterial]

  if (lower.includes('city')) {
    objects.push(
      {
        id: 'city-ground',
        name: 'Ground Plane',
        meshUrl: '/assets/meshes/plane.glb',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [20, 1, 20],
        material: 'mat-default',
      },
      {
        id: 'city-tower',
        name: 'Tower Block',
        meshUrl: '/assets/meshes/cube.glb',
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [2, 3, 2],
        material: 'mat-default',
      },
    )
  } else if (lower.includes('character')) {
    objects.push({
      id: 'char-rig',
      name: 'Character Rig Placeholder',
      meshUrl: '/assets/meshes/character.glb',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      material: 'mat-default',
    })
  } else {
    objects.push({
      id: 'starter-object',
      name: 'Starter Cube',
      meshUrl: '/assets/meshes/cube.glb',
      position: [0, 1, 0],
      rotation: [0, 0.2, 0],
      scale: [1, 1, 1],
      material: 'mat-default',
    })
  }

  return {
    objects,
    materials,
    lights,
    camera: baseCamera,
    skybox: {
      type: 'equirect',
      url: '/assets/skyboxes/default.hdr',
    },
  }
}
