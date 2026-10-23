import { describe, expect, it } from "vitest";
import { isGaussianPlyHeader } from "../apps/web/lib/3d/gaussian-ply-header";

describe("WonderPlay Gaussian PLY import preflight", () => {
  it("accepts an ordinary Gaussian float PLY header", () => {
    expect(isGaussianPlyHeader("ply\nformat binary_little_endian 1.0\nelement vertex 1\nproperty float x\nproperty float scale_0\nproperty float f_dc_0\nend_header\n")).toBe(true);
  });

  it("accepts the compressed Gaussian schema used by PlayCanvas", () => {
    const lines = [
      "ply", "format binary_little_endian 1.0", "element chunk 1", "property float min_x",
      "element vertex 1", "property uint packed_position", "property uint packed_rotation",
      "property uint packed_scale", "property uint packed_color", "end_header", "",
    ];
    expect(isGaussianPlyHeader(lines.join("\r\n"))).toBe(true);
  });

  it("rejects ordinary point clouds and incomplete packed attribute groups", () => {
    expect(isGaussianPlyHeader("ply\nformat ascii 1.0\nelement vertex 2\nproperty float x\nproperty float y\nend_header\n")).toBe(false);
    expect(isGaussianPlyHeader("ply\nelement chunk 1\nelement vertex 1\nproperty uint packed_position\nend_header\n")).toBe(false);
    expect(isGaussianPlyHeader("not a PLY")).toBe(false);
  });
});
