import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'

export function createArcCamera(
  name: string,
  alpha: number,
  beta: number,
  radius: number,
  target: [number, number, number],
  scene: Scene
): ArcRotateCamera {
  const cam = new ArcRotateCamera(
    name,
    alpha,
    beta,
    radius,
    new Vector3(target[0], target[1], target[2]),
    scene
  )
  return cam
}

export function createFollowCamera(
  name: string,
  position: [number, number, number],
  target: [number, number, number],
  scene: Scene
): ArcRotateCamera {
  const pos = new Vector3(position[0], position[1], position[2])
  const tgt = new Vector3(target[0], target[1], target[2])
  const dist = Vector3.Distance(pos, tgt)
  const alpha = Math.atan2(pos.x - tgt.x, pos.z - tgt.z)
  const beta = Math.acos((pos.y - tgt.y) / Math.max(dist, 0.001))
  const cam = new ArcRotateCamera(name, alpha, beta, dist, tgt, scene)
  return cam
}

export function panCamera(
  camera: ArcRotateCamera,
  deltaX: number,
  deltaY: number
): void {
  camera.target.x += deltaX
  camera.target.y += deltaY
}

export function zoomCamera(
  camera: ArcRotateCamera,
  delta: number
): void {
  const newRadius = Math.max(camera.radius - delta, 0.5)
  camera.radius = newRadius
}

export function orbitCamera(
  camera: ArcRotateCamera,
  deltaAlpha: number,
  deltaBeta: number
): void {
  camera.alpha += deltaAlpha
  camera.beta = Math.max(0.1, Math.min(Math.PI - 0.1, camera.beta + deltaBeta))
}

export function resetCamera(
  camera: ArcRotateCamera,
  alpha: number,
  beta: number,
  radius: number
): void {
  camera.alpha = alpha
  camera.beta = beta
  camera.radius = radius
}
