export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const arr = new Uint8Array(12)
  crypto.getRandomValues(arr)
  for (let i = 0; i < arr.length; i++) {
    result += chars[arr[i] % chars.length]
  }
  return result
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function vec3Length(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}

export function vec3Normalize(x: number, y: number, z: number): [number, number, number] {
  const len = vec3Length(x, y, z)
  if (len === 0) return [0, 0, 0]
  return [x / len, y / len, z / len]
}

export function vec3Dot(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number
): number {
  return ax * bx + ay * by + az * bz
}

export function vec3Cross(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number
): [number, number, number] {
  return [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx
  ]
}

export function vec3Subtract(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number
): [number, number, number] {
  return [ax - bx, ay - by, az - bz]
}

export function vec3Add(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number
): [number, number, number] {
  return [ax + bx, ay + by, az + bz]
}

export function vec3Scale(
  x: number, y: number, z: number,
  s: number
): [number, number, number] {
  return [x * s, y * s, z * s]
}

export function quaternionFromEuler(
  pitch: number, yaw: number, roll: number
): [number, number, number, number] {
  const cy = Math.cos(yaw * 0.5)
  const sy = Math.sin(yaw * 0.5)
  const cp = Math.cos(pitch * 0.5)
  const sp = Math.sin(pitch * 0.5)
  const cr = Math.cos(roll * 0.5)
  const sr = Math.sin(roll * 0.5)
  return [
    sr * cp * cy - cr * sp * sy,
    cr * sp * cy + sr * cp * sy,
    cr * cp * sy - sr * sp * cy,
    cr * cp * cy + sr * sp * sy
  ]
}

export function eulerFromQuaternion(
  x: number, y: number, z: number, w: number
): [number, number, number] {
  const sinr = 2 * (w * x + y * z)
  const cosr = 1 - 2 * (x * x + y * y)
  const roll = Math.atan2(sinr, cosr)
  const sinp = 2 * (w * y - z * x)
  const pitch = Math.abs(sinp) >= 1
    ? Math.sign(sinp) * Math.PI / 2
    : Math.asin(sinp)
  const siny = 2 * (w * z + x * y)
  const cosy = 1 - 2 * (y * y + z * z)
  const yaw = Math.atan2(siny, cosy)
  return [pitch, yaw, roll]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T, delay: number
): (...args: Parameters<T>) => void {
  let last = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn(...args)
    }
  }
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T, delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
