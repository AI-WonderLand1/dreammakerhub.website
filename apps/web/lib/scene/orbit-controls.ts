type Vector3 = { x: number; y: number; z: number };

export type OrbitState = { dist: number; az: number; el: number };

/** PlayCanvas orbit angles: azimuth around Y, elevation measured from +Y. */
export function orbitFromCameraPosition(
  position: readonly [number, number, number],
  target: readonly [number, number, number],
): OrbitState {
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 1e-6) return { dist: 0.01, az: 0, el: 90 };

  return {
    dist,
    az: (Math.atan2(dx, dz) * 180) / Math.PI,
    el: (Math.acos(Math.max(-1, Math.min(1, dy / dist))) * 180) / Math.PI,
  };
}

/** Move the orbit pivot in the camera's screen-aligned world directions. */
export function panOrbitTarget(
  target: Vector3,
  right: Vector3,
  up: Vector3,
  dx: number,
  dy: number,
  sensitivity = 0.03,
): void {
  const horizontal = -dx * sensitivity;
  const vertical = dy * sensitivity;
  target.x += right.x * horizontal + up.x * vertical;
  target.y += right.y * horizontal + up.y * vertical;
  target.z += right.z * horizontal + up.z * vertical;
}
