/** Small tileable detail maps for WonderPlay's starter primitives, not imported assets. */
export type StarterSurface = "terrain" | "concrete" | "coated-metal" | "fabric";

type SurfaceMaps = {
  color: Uint8ClampedArray;
  normal: Uint8ClampedArray;
};

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hash(x: number, y: number) {
  let value = Math.imul(x + 29, 374761393) + Math.imul(y + 47, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(x: number, y: number, cells: number) {
  const px = x * cells;
  const py = y * cells;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const sx = (px - ix) ** 2 * (3 - 2 * (px - ix));
  const sy = (py - iy) ** 2 * (3 - 2 * (py - iy));
  const sample = (dx: number, dy: number) => hash((ix + dx) % cells, (iy + dy) % cells);
  const top = sample(0, 0) * (1 - sx) + sample(1, 0) * sx;
  const bottom = sample(0, 1) * (1 - sx) + sample(1, 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

/** Deterministic, periodic texture pixels. No files, network or customer GLBs are modified. */
export function createStarterSurfaceMaps(surface: StarterSurface, size = 128): SurfaceMaps {
  if (!Number.isInteger(size) || size < 8 || size > 1024) throw new RangeError("Surface texture size must be 8–1024 pixels");
  const heights = new Float32Array(size * size);
  const color = new Uint8ClampedArray(size * size * 4);
  const normal = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const broad = noise(u, v, 4);
      const grain = noise(u, v, 16);
      const fine = noise(u, v, 64);
      const weave = Math.sin(u * Math.PI * 64) * Math.sin(v * Math.PI * 64);
      const brushed = noise(0, v, 64);
      const n = surface === "fabric" ? 0.55 * weave + 0.45 * fine
        : surface === "coated-metal" ? 0.6 * brushed + 0.4 * fine
          : 0.55 * broad + 0.32 * grain + 0.13 * fine;
      const index = y * size + x;
      heights[index] = n;
      const multiplier = surface === "coated-metal" ? 0.91 + 0.13 * n
        : surface === "fabric" ? 0.8 + 0.18 * n
          : surface === "terrain" ? 0.72 + 0.32 * n : 0.77 + 0.29 * n;
      const shade = clampByte(255 * multiplier);
      for (let channel = 0; channel < 3; channel++) color[index * 4 + channel] = shade;
      color[index * 4 + 3] = 255;
    }
  }

  const bump = surface === "coated-metal" ? 1.15 : surface === "fabric" ? 1.7 : 2.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const at = (xx: number, yy: number) => heights[((yy + size) % size) * size + ((xx + size) % size)];
      const dx = (at(x + 1, y) - at(x - 1, y)) * bump;
      const dy = (at(x, y + 1) - at(x, y - 1)) * bump;
      const length = Math.hypot(dx, dy, 1);
      const index = (y * size + x) * 4;
      normal[index] = clampByte(127.5 * (1 - dx / length));
      normal[index + 1] = clampByte(127.5 * (1 - dy / length));
      normal[index + 2] = clampByte(127.5 * (1 + 1 / length));
      normal[index + 3] = 255;
    }
  }
  return { color, normal };
}
