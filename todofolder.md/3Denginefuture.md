# 3D Engine Future — WebGPU Custom Engine Blueprint

**Status:** Conceptual / "later"
**Date:** 2026-08-08
**Target:** Self-contained WebGPU engine with Nanite-style cluster culling, Lumen-style dynamic GI, and TSR-style temporal upscaling.

---

## Vision

Replicate the visual fidelity of Unreal Engine 5's core systems — Nanite (virtualized geometry), Lumen (dynamic global illumination), and TSR (temporal super-resolution) — entirely in WebGPU Compute Shaders (WGSL), removing CPU bottlenecks and running in the browser.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WebGPU Custom Engine                     │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  Asset Pipeline│  │  Compute Layer│  │  Render Pipeline│  │
│  │  (Node.js/Python)│  │  (WGSL)       │  │  (GPU compute)  │  │
│  └──────┬────────┘  └──────┬────────┘  └────────┬────────┘  │
│         │                 │                      │            │
│  ┌──────┴───────────────────┴────────────────────┴──────────┐  │
│  │          Scene Graph / Entity System                      │  │
│  │    (transforms, materials, lighting, SDF volumes)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Rendering Output (Canvas/WebGL)                  │ │
│  │  Frame Buffer → Temporal Accumulation → Upscale → GPU │ │
│  │  Downsample → Compositor → Display                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Nanite: Virtualized Cluster Culling

### Goal
Render only the triangles that matter for the current frame, streaming infinite detail without loading the entire mesh.

### Pipeline

#### 1.1 Offline Mesh Clusterization

**Purpose:** Break a high-poly mesh into manageable clusters for GPU-driven rendering.

**Process:**
1. **Mesh Parsing:** Read `.gltf`/`.obj`/`.fbx` files, extract vertex positions, indices, and mesh data.
2. **Meshopt Clusterization:** Use Meshoptimizer to group connected triangles into clusters of 64–128 triangles each.
3. **Bounding Spheres:** For each cluster, compute a tight bounding sphere (center + radius).
4. **DAG Construction:** Build a Level-of-Detail (LOD) hierarchy tree by grouping adjacent clusters, simplifying geometry (reducing triangle count by ~50%), and saving parent clusters.

**Output:** A DAG of clusters with:
- `center: vec3<f32>` — bounding sphere center
- `radius: f32` — bounding sphere radius
- `startIndex: u32` — starting index in the original mesh buffer
- `indexCount: u32` — number of triangles in this cluster
- `parentIndex: u32` — index of the parent cluster (or null)

#### 1.2 GPU-Driven Occlusion Culling

**Runtime:** CPU passes cluster bounds to GPU. GPU decides what to draw.

**Compute Shader (WGSL):**

```glsl
// Cluster Culling — GPU-driven
struct Cluster {
    center: vec3<f32>;
    radius: f32;
    startIndex: u32;
    indexCount: u32;
};

struct IndirectDrawCommand {
    indexCount: u32;
    instanceCount: u32;
    firstIndex: u32;
    baseVertex: i32;
    firstInstance: u32;
};

@group(0) @binding(0) var<storage, read> clusters: array<Cluster>;
@group(0) @binding(1) var<storage, read_write> drawCommands: array<IndirectDrawCommand>;
@group(0) @binding(2) var<storage, read_write> globalDrawCount: atomic<u32>;
@group(0) @binding(3) var<uniform> cameraFrustum: array<vec4<f32>, 6>;

@compute @workgroup_size(64)
fn culling_main(@builtin(global_invocation_id) id: vec3<u32>) {
    let clusterIndex = id.x;
    if (clusterIndex >= arrayLength(&clusters)) { return; }

    let cluster = clusters[clusterIndex];
    var visible = true;

    // 1. Simple Frustum Culling Plane Checks
    for (var i = 0; i < 6; i++) {
        let distance = dot(cameraFrustum[i].xyz, cluster.center) + cameraFrustum[i].w;
        if (distance < -cluster.radius) {
            visible = false; // Cluster is completely outside this plane
            break;
        }
    }

    // 2. Append to WebGPU Indirect Buffer if visible
    if (visible) {
        let drawIdx = atomicAdd(&globalDrawCount, 1u);
        drawCommands[drawIdx].indexCount = cluster.indexCount;
        drawCommands[drawIdx].instanceCount = 1u;
        drawCommands[drawIdx].firstIndex = cluster.startIndex;
        drawCommands[drawIdx].baseVertex = 0;
        drawCommands[drawIdx].firstInstance = 0;
    }
}
```

**Indirect Draw Pattern:**
- GPU computes draw commands atomically
- Commands are written to a GPU buffer with `GPUBufferUsage.INDIRECT`
- CPU renders by dispatching with `drawIndirect` command buffer

#### 1.3 LOD Rendering Strategy

- **LOD 0:** Full-resolution clusters (near camera, or high-poly)
- **LOD 1:** Simplified clusters (50% triangles, parent cluster in view)
- **LOD 2:** Even further simplified (25% triangles)
- **LOD N:** Clips or skips clusters

---

## 2. Lumen: Real-Time SDF Raymarching

### Goal
Produce dynamic global illumination and reflections without pre-baked lightmaps. Use signed distance fields for raymarching.

### Pipeline

#### 2.1 Voxelize the World into Global SDFs

**Purpose:** Convert 3D geometry into a low-resolution 3D volume texture where each pixel stores the signed distance to the nearest surface.

**Process:**
1. **Model Import:** Parse `.gltf`/`.obj` files, extract mesh surface geometry.
2. **Grid Generation:** Create a global 32×32×32 volume texture. Each voxel stores a `f32` (distance to nearest surface).
   - Negative values = inside the object
   - Positive values = outside the object
3. **SDF Approximation:** For each voxel, estimate distance using:
   - Signed distance field from vertex positions
   - Octahedral sampling of surface normals
   - Sphere clipping for convex/concave regions

#### 2.2 Raymarching Global Illumination

**Purpose:** At each pixel on screen, trace a ray through the global SDF volume to compute lighting.

**Compute Shader (WGSL):**

```glsl
// Raymarching for Global Illumination
struct Ray {
    origin: vec3<f32>;
    direction: vec3<f32>;
};

struct SDFResult {
    distance: f32;
    point: vec3<f32>;
    hit: f32; // 1.0 = hit, 0.0 = miss
};

@group(1) @binding(0) var globalSdfTex: texture_3d<f32>;
@group(1) @binding(1) var textureSampler: sampler;

fn sample_global_sdf(pos: vec3<f32>) -> f32 {
    // Map world coordinates directly to your 0.0 - 1.0 3D Texture volume space
    let texCoord = pos * 0.01 + vec3<f32>(0.5);
    return textureSample(globalSdfTex, textureSampler, texCoord).r;
}

fn raymarch_lumen_light(rayOrigin: vec3<f32>, rayDir: vec3<f32>) -> vec3<f32> {
    var t = 0.1;
    let maxDist = 50.0;

    for (var i = 0; i < 64; i++) {
        let currentPos = rayOrigin + rayDir * t;
        let distanceToSurface = sample_global_sdf(currentPos);

        // A surface hit is detected
        if (distanceToSurface < 0.01) {
            // Return an approximation of global illumination/specular bounce at this coordinate
            return vec3<f32>(0.8, 0.7, 0.6) * (1.0 / (t * t));
        }

        t += max(distanceToSurface, 0.02); // Step safely along the distance field
        if (t > maxDist) { break; }
    }
    return vec3<f32>(0.0); // No light hit (Sky color)
}
```

#### 2.3 Light Probe System

- **Screen-Space Trace:** For every pixel on the screen, shoot a light probe ray out into the scene. First, check the screen-space depth buffer (SSR) for immediate geometry reflections.
- **SDF Fallback:** If the screen-space ray misses or goes behind an object, switch to raymarching through the Global SDF 3D Texture volume.
- **Light Gather:** Read the color map texture at the hit coordinate to inject bounce lighting back into the starting camera pixel.

---

## 3. TSR: Temporal Image Upscaling

### Goal
Maintain smooth frame rates by rendering at low resolution and upscaling, using motion vectors and history buffers.

### Pipeline

#### 3.1 Render a Velocity Pass

**Purpose:** Track how pixels moved between frames for temporal upscaling.

**Process:**
1. **Velocity Buffer:** In the standard PBR material fragment shader, output a `vec2<f32>` velocity texture.
2. **Motion Vector Math:** For every vertex, calculate its current clip-space position screen coordinate and its previous clip-space position screen coordinate using a saved matrix from the last frame.
3. **Delta Calculation:** Subtract the two screen positions to find exactly how many pixels that vertex moved across the screen between Frame A and Frame B.

#### 3.2 Temporal Accumulation Pass

**Purpose:** Upscale the low-resolution frame to high-resolution while denoising.

**Compute Shader (WGSL):**

```glsl
// Temporal Super-Resolution (TSR) — GPU compute
// Outputs to high-resolution screen resolution canvas

struct FrameData {
    // Current frame color buffer (high-res)
    color: vec4<f32>;
    // Previous frame color buffer (high-res)
    prevColor: vec4<f32>;
    // Motion vector for this pixel
    velocity: vec2<f32>;
};

@group(2) @binding(0) var currentFrame: texture_2d<f32>;
@group(2) @binding(1) var prevFrame: texture_2d<f32>;
@group(2) @binding(2) var velocityTex: texture_2d<f32>;
@group(2) @binding(3) var globalDrawCount: atomic<u32>;

@compute @workgroup_size(16)
fn tsr_accumulate(@builtin(global_invocation_id) id: vec3<u32>) {
    let x = id.x;
    let y = id.y;

    // 1. Reconstruct coordinates
    let newPos = vec2<f32>(
        (x / u32(w) * 2.0 - 1.0),
        (y / u32(h) * 2.0 - 1.0)
    );

    // 2. Find corresponding source location in low-res frame
    let lowResX = (newPos.x + 1.0) * 0.5 * lowResWidth;
    let lowResY = (newPos.y + 1.0) * 0.5 * lowResHeight;

    // 3. Look back in time using velocity buffer
    let velocity = textureSample(velocityTex, velocitySampler, newPos);
    let prevPos = newPos - velocity * frameDuration;

    // 4. Read old frame history and blend
    let oldColor = textureSample(prevFrame, prevSampler, prevPos);
    let newColor = textureSample(currentFrame, currentSampler, newPos);

    // 5. History clamping — prevent ghosting streaks
    let diff = length(newColor - oldColor);
    if (diff > 0.5) {
        // New frame is wildly different — discard old history
        let blended = newColor * 0.9 + oldColor * 0.1;
        output = blended;
    } else {
        // Exponential moving average weight
        let blend = exp(-1.0 / max(diff, 0.001));
        let output = newColor * 0.1 + oldColor * 0.9;
    }
}
```

---

## 4. Engine Integration Architecture

### 4.1 Asset Pipeline (Node.js / Python)

**Purpose:** Convert `.gltf` mesh assets to clusterized DAGs for Nanite-style culling.

**Script:**
- Reads 3D mesh files, extracts mesh data using Meshoptimizer
- Groups triangles into clusters of 64–128
- Computes bounding spheres for each cluster
- Builds a DAG of clusters (parent-child relationship)
- Outputs a JSON file with cluster data for the engine to load at runtime

### 4.2 Compute Layer (WGSL)

**Purpose:** Run GPU compute shaders for all real-time operations.

**Compute Shaders:**
| Shader | Purpose | Location |
|--------|---------|----------|
| `culling_main` | Cluster occlusion culling | `@group(0)` |
| `sdf_raymarch` | SDF-based lighting | `@group(1)` |
| `tsr_accumulate` | Temporal upscaling | `@group(2)` |

### 4.3 Render Pipeline (GPU)

**Frame Loop:**
1. Clear render targets
2. Run culling compute shader (draw only visible clusters)
3. Run SDF raymarching compute shader (global illumination)
4. Run TSR temporal accumulation compute shader (upscaling)
5. Copy result to screen

### 4.4 Scene Graph / Entity System

- **Transforms:** Position, rotation, scale per entity
- **Materials:** PBR material properties
- **Lighting:** SDF volume, light probes
- **Mesh:** WGSL compute shader processing pipeline

---

## 5. Feasibility Summary

| System | UE5 Approach | WebGPU Current State | Feasible? |
|--------|---------------|----------------------|-----------|
| **Nanite** | Mesh shaders, GPU culling | ✅ Compute shaders, ✅ indirect draw | **Partial** — GPU culling + indirect draws = doable; mesh shaders not yet in WebGPU |
| **Lumen** | SDF raymarching + RT fallback | ✅ Compute shaders, ✅ texture sampling | **Partial** — SDF raymarching = doable; RT fallback not yet in WebGPU |
| **TSR** | Motion vectors + history | ✅ Velocity buffer, ✅ compute shaders | **Yes** — fully achievable |

---

## 6. Next Steps

- [ ] Build Node.js asset parser that reads `.gltf` files and outputs cluster DAGs
- [ ] Implement `culling_main` compute shader in WGSL
- [ ] Implement `sdf_raymarch` compute shader in WGSL
- [ ] Implement `tsr_accumulate` compute shader in WGSL
- [ ] Integrate all three into the `ThreeViewport` rendering pipeline
- [ ] Wire up the scene graph / entity system
- [ ] Benchmark and optimize
- [ ] Add full SDF-based GI with light probes

---

## 7. Tech Stack

| Component | Technology |
|-----------|-----------|
| **Language** | WGSL (WebGPU Shading Language) |
| **Rendering** | WebGPU Canvas 2D/3D |
| **Asset Pipeline** | Node.js (or Python) |
| **Culling** | WGSL compute shaders (threaded by 64) |
| **Raymarching** | WGSL compute shaders (per-pixel) |
| **Upscaling** | WGSL compute shaders (temporal accumulation) |
| **Scene Graph** | Custom entity system (no engine dependency) |
| **Integration** | Custom WGSL shader pipeline |

---

*Document version: 1.0 — Conceptual/Experimental*
