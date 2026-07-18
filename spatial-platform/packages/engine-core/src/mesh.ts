import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import type { SceneObject } from '@spatial/core'

export function createMesh(obj: SceneObject, scene: Scene): Mesh {
  let mesh: Mesh

  switch (obj.type) {
    case 'box':
      mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, scene)
      break
    case 'sphere':
      mesh = MeshBuilder.CreateSphere(obj.name, { diameter: 1 }, scene)
      break
    case 'plane':
      mesh = MeshBuilder.CreatePlane(obj.name, { size: 1 }, scene)
      break
    case 'cylinder':
      mesh = MeshBuilder.CreateCylinder(obj.name, { height: 1, diameter: 1 }, scene)
      break
    case 'ground':
      mesh = MeshBuilder.CreateGround(obj.name, { width: 1, height: 1 }, scene)
      break
    case 'torus':
      mesh = MeshBuilder.CreateTorus(obj.name, { diameter: 1, thickness: 0.4 }, scene)
      break
    case 'capsule':
      mesh = MeshBuilder.CreateCapsule(obj.name, {}, scene)
      break
    default:
      mesh = MeshBuilder.CreateBox(obj.name, { size: 1 }, scene)
  }

  mesh.position = new Vector3(obj.position[0], obj.position[1], obj.position[2])
  mesh.rotation = new Vector3(obj.rotation[0], obj.rotation[1], obj.rotation[2])
  mesh.scaling = new Vector3(obj.scale[0], obj.scale[1], obj.scale[2])

  if (obj.material) {
    const mat = new StandardMaterial(`mat_${obj.id}`, scene)
    mat.diffuseColor = new Color4(
      obj.material.color[0],
      obj.material.color[1],
      obj.material.color[2]
    )
    mat.metallic = obj.material.metallic
    mat.roughness = obj.material.roughness
    if (obj.material.emissive) {
      mat.emissiveColor = new Color4(
        obj.material.emissive[0],
        obj.material.emissive[1],
        obj.material.emissive[2]
      )
    }
    mat.alpha = obj.material.opacity
    mesh.material = mat
  }

  return mesh
}

export function cloneMesh(mesh: Mesh, newName: string, scene: Scene): Mesh | null {
  const clone = mesh.clone(newName) as Mesh | null
  if (clone) {
    clone.position = mesh.position.clone()
    clone.rotation = mesh.rotation.clone()
    clone.scaling = mesh.scaling.clone()
  }
  return clone
}

export function setMeshPosition(mesh: Mesh, x: number, y: number, z: number): void {
  mesh.position.set(x, y, z)
}

export function setMeshRotation(mesh: Mesh, x: number, y: number, z: number): void {
  mesh.rotation.set(x, y, z)
}

export function setMeshScale(mesh: Mesh, x: number, y: number, z: number): void {
  mesh.scaling.set(x, y, z)
}
