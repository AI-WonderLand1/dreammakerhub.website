/** Fit a bounding sphere inside either a wide game view or a narrow editor pane. */
export function fitOrbitDistance(radius: number, verticalFovDegrees: number, aspect: number): number {
  const safeRadius = Math.max(0.25, Number.isFinite(radius) ? radius : 0.25);
  const vertical = Math.max(5, Math.min(140, verticalFovDegrees)) * Math.PI / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * Math.max(0.1, aspect));
  return Math.max(0.5, (safeRadius * 1.3) / Math.sin(Math.min(vertical, horizontal) / 2));
}

/** Avoid using a 10 km far plane for tiny props: that destroys depth precision. */
export function orbitClipPlanes(distance: number, framedRadius: number): { near: number; far: number } {
  const safeDistance = Math.max(0.05, Number.isFinite(distance) ? distance : 1);
  const safeRadius = Math.max(0, Number.isFinite(framedRadius) ? framedRadius : 0);
  return {
    near: Math.max(0.005, Math.min(2, safeDistance / 500)),
    far: Math.max(200, safeDistance + Math.max(100, safeRadius * 3)),
  };
}
