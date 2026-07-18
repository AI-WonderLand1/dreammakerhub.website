import type { MotionSample } from './intent'
import type { LateralGesture } from './patterns'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface SpatialTransform {
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export interface SpatialGesture {
  gesture: LateralGesture
  transform: SpatialTransform
  confidence: number
}

function normalizeCoord(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function depthFromVelocity(velocity: number): number {
  const clamped = Math.min(1, velocity / 2)
  return 0.3 + clamped * 0.7
}

export function motionSampleToVec3(sample: MotionSample): Vec3 {
  return {
    x: normalizeCoord(sample.wrist.x),
    y: normalizeCoord(sample.wrist.y),
    z: depthFromVelocity(sample.velocity)
  }
}

export function computeSpatialTransform(
  samples: MotionSample[],
  gesture: LateralGesture
): SpatialTransform {
  if (samples.length === 0) {
    return { position: { x: 0.5, y: 0.5, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
  }

  const latest = samples[samples.length - 1]
  const pos = motionSampleToVec3(latest)

  let rotX = 0, rotY = 0, rotZ = 0
  let scaleX = 1, scaleY = 1, scaleZ = 1

  if (gesture === 'swipe' && samples.length >= 2) {
    const dx = samples[samples.length - 1].wrist.x - samples[0].wrist.x
    const dy = samples[samples.length - 1].wrist.y - samples[0].wrist.y
    rotZ = dx * 90
    rotX = dy * 90
    scaleX = 1 + Math.abs(dx)
    scaleY = 1 + Math.abs(dy)
  }

  if (gesture === 'wave') {
    const amplitude = samples.reduce((max, s) => Math.max(max, Math.abs(s.wrist.x - 0.5)), 0)
    rotZ = amplitude * 180
    scaleX = 1 + amplitude
    scaleY = 1 - amplitude * 0.3
  }

  return {
    position: pos,
    rotation: { x: rotX, y: rotY, z: rotZ },
    scale: { x: scaleX, y: scaleY, z: scaleZ }
  }
}

export function classifySpatialGesture(
  samples: MotionSample[],
  lateralGesture: LateralGesture
): SpatialGesture {
  const transform = computeSpatialTransform(samples, lateralGesture)
  const confidence = lateralGesture !== 'none' ? Math.min(1, samples.length / 10) : 0

  return { gesture: lateralGesture, transform, confidence }
}

export function normalizeSpatialCoordinates(
  coords: { x: number; y: number; z: number },
  frame: { width: number; height: number; depth?: number }
): Vec3 {
  return {
    x: coords.x / frame.width,
    y: coords.y / frame.height,
    z: frame.depth ? coords.z / frame.depth : coords.z
  }
}