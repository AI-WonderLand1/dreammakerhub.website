import { Animation } from '@babylonjs/core/Animations/animation'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'

export function createPositionAnimation(
  property: string,
  frames: { frame: number; value: [number, number, number] }[],
  fps = 30
): Animation {
  const anim = new Animation(
    `posAnim_${Date.now()}`,
    property,
    fps,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CYCLE
  )
  const keys = frames.map(f => ({
    frame: f.frame,
    value: new Vector3(f.value[0], f.value[1], f.value[2])
  }))
  anim.setKeys(keys)
  return anim
}

export function createRotationAnimation(
  property: string,
  frames: { frame: number; value: [number, number, number] }[],
  fps = 30
): Animation {
  const anim = new Animation(
    `rotAnim_${Date.now()}`,
    property,
    fps,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CYCLE
  )
  const keys = frames.map(f => ({
    frame: f.frame,
    value: new Vector3(f.value[0], f.value[1], f.value[2])
  }))
  anim.setKeys(keys)
  return anim
}

export function createScaleAnimation(
  property: string,
  frames: { frame: number; value: [number, number, number] }[],
  fps = 30
): Animation {
  const anim = new Animation(
    `scaleAnim_${Date.now()}`,
    property,
    fps,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CYCLE
  )
  const keys = frames.map(f => ({
    frame: f.frame,
    value: new Vector3(f.value[0], f.value[1], f.value[2])
  }))
  anim.setKeys(keys)
  return anim
}

export function playAnimation(
  mesh: Mesh,
  animation: Animation,
  scene: Scene,
  speed = 1
): void {
  mesh.animations = [animation]
  scene.beginAnimation(mesh, 0, animation.getKeys().length - 1, true, speed)
}

export function stopAnimation(mesh: Mesh, scene: Scene): void {
  scene.stopAnimation(mesh)
}

export interface AnimationClip {
  name: string
  property: string
  frames: { frame: number; value: [number, number, number] }[]
  loopMode?: number
}

export function playClip(
  mesh: Mesh,
  clip: AnimationClip,
  scene: Scene,
  fps = 30,
  speed = 1
): Animation {
  const anim = new Animation(
    clip.name,
    clip.property,
    fps,
    Animation.ANIMATIONTYPE_VECTOR3,
    clip.loopMode ?? Animation.ANIMATIONLOOPMODE_CYCLE
  )
  const keys = clip.frames.map(f => ({
    frame: f.frame,
    value: new Vector3(f.value[0], f.value[1], f.value[2])
  }))
  anim.setKeys(keys)
  mesh.animations = [anim]
  scene.beginAnimation(mesh, 0, clip.frames.length - 1, true, speed)
  return anim
}
