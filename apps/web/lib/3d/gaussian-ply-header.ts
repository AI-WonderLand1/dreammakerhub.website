/**
 * Cheap import preflight for Gaussian PLY files. PlayCanvas performs the full
 * binary/attribute parse when the asset loads; this accepts its two supported
 * Gaussian attribute layouts while rejecting ordinary point-cloud PLY files.
 */
export function isGaussianPlyHeader(input: string): boolean {
  const header = input.replace(/\r\n/g, "\n");
  if (!header.startsWith("ply\n")) return false;
  const headerEnd = header.indexOf("\nend_header");
  if (headerEnd < 0) return false;

  const lines = header.slice(0, headerEnd).split("\n").map((line) => line.trim());
  const vertexIndex = lines.findIndex((line) => /^element vertex [1-9]\d*$/.test(line));
  if (vertexIndex < 0) return false;

  // Standard Gaussian PLY: ordinary float splat attributes on each vertex.
  const uncompressed = lines.includes("property float scale_0") &&
    lines.includes("property float f_dc_0");

  // PlayCanvas also reads compressed Gaussian PLY: chunk bounds plus packed
  // vertex attributes. The field types matter (each packed field is uint).
  const chunkIndex = lines.findIndex((line) => /^element chunk [1-9]\d*$/.test(line));
  const compressed = chunkIndex >= 0 && chunkIndex < vertexIndex &&
    ["packed_position", "packed_rotation", "packed_scale", "packed_color"]
      .every((name) => lines.includes(`property uint ${name}`));

  return uncompressed || compressed;
}
