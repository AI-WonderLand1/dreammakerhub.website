"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { orbitFromCameraPosition, panOrbitTarget } from "@/lib/scene/orbit-controls";
import { fitOrbitDistance, orbitClipPlanes } from "@/lib/scene/camera-framing";
import { normalizeHdrEnvironmentUrl } from "@/lib/scene/hdr-environment";
import { RENDER_QUALITY_PRESETS } from "@/lib/scene/render-quality";
import { logger } from "@/lib/logger";

export type StudioSelection = { name: string; id: string; entityId?: number };

export type ViewportStats = { fps: number; entities: number; frames: number };

export type StudioViewportHandle = {
  renderScene: (scene: GeneratedScene) => void;
  clearScene: () => void;
  injectModel: (gltfUrl: string, assetId?: string) => void;
  getApp: () => any | null;
  getPc: () => any | null;
  renderPanorama: (opts?: PanoramaOpts) => void;
  clearPanorama: () => void;
  setToneMapping: (mode: ToneMappingMode) => void;
  setExposure: (value: number) => void;
  setFov: (fov: number) => void;
  placeActor: (opts: { name: string; type: string; x: number; y: number }) => void;
  clearActors: () => void;
  animateCameraPath: (opts: CameraPathOpts) => void;
  highlightEntity: (id: string | null) => void;
  captureSnapshot: () => string | null;
  setWireframe: (enabled: boolean) => void;
  setShadows: (enabled: boolean) => void;
  setAmbient: (color: [number, number, number], intensity?: number) => void;
  focusOn: (id: string | null) => void;
  getStats: () => ViewportStats;
  setShowGrid: (enabled: boolean) => void;
  setRenderQuality: (quality: RenderQuality) => void;
  setEnvironmentLighting: (mode: EnvironmentLightingMode, hdrUrl?: string) => void;
};

export type ToneMappingMode = "ACES" | "Filmic" | "HEJL" | "Linear" | "Neutral";
export type RenderQuality = "performance" | "high" | "cinematic";
export type EnvironmentLightingMode = "studio" | "outdoor" | "hdri" | "off";
type EnvironmentPreset = "studio" | "outdoor";

export type CameraPathOpts = {
  enabled: boolean;
  speed?: number;
  radius?: number;
  targetY?: number;
  lookAt?: [number, number, number];
  ease?: boolean;
};

export type PanoramaOpts = {
  exposure?: number;
  fov?: number;
  baseColor?: [number, number, number];
  skyColor?: [number, number, number];
  horizonColor?: [number, number, number];
  hotspotCount?: number;
  hotspotRadius?: number;
  skyboxUrl?: string;
};

export type StudioViewportProps = {
  onMeshStatus?: (detail: { objectId: string; state: "loaded" | "error"; message?: string }) => void;
  onEnvironmentStatus?: (detail: { state: "loaded" | "error"; message?: string }) => void;
  onReady?: () => void;
  onSelect?: (selection: StudioSelection) => void;
  onEntityCreated?: (entity: { name: string; id: string }) => void;
  className?: string;
  showGizmo?: boolean;
  showGrid?: boolean;
  showStats?: boolean;
  showFps?: boolean;
};

const TONE_MAPPING_CONSTANTS: Record<ToneMappingMode, string> = {
  ACES: "TONEMAP_ACES",
  Filmic: "TONEMAP_FILMIC",
  HEJL: "TONEMAP_HEJL",
  Linear: "TONEMAP_LINEAR",
  Neutral: "TONEMAP_NEUTRAL",
};

// Small, generated light probes are included with the viewer, not with users'
// GLBs. The prefiltered atlas lets authored PBR metals and rough surfaces pick
// up directional reflections instead of relying on flat ambient illumination.
function createEnvironmentProbe(mode: EnvironmentPreset): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas is required for environment lighting");

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  if (mode === "studio") {
    gradient.addColorStop(0, "#b3c8df");
    gradient.addColorStop(0.45, "#e2e2de");
    gradient.addColorStop(0.51, "#c6b9ae");
    gradient.addColorStop(1, "#77777d");
  } else {
    gradient.addColorStop(0, "#79add9");
    gradient.addColorStop(0.45, "#d4dfd9");
    gradient.addColorStop(0.51, "#e3bd8a");
    gradient.addColorStop(1, "#726250");
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // A broad photographic softbox / sun reflection helps curved shiny meshes.
  const x = mode === "studio" ? 135 : 375;
  const y = mode === "studio" ? 83 : 101;
  const radius = mode === "studio" ? 88 : 55;
  const glow = context.createRadialGradient(x, y, 2, x, y, radius);
  glow.addColorStop(0, mode === "studio" ? "rgba(255,255,255,0.95)" : "rgba(255,246,207,0.98)");
  glow.addColorStop(0.3, "rgba(255,249,226,0.6)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  return canvas;
}

function updateEnvironmentLighting(
  app: any,
  pc: any,
  mode: EnvironmentLightingMode,
  quality: RenderQuality,
  cache: Map<EnvironmentPreset, any>,
) {
  // Avoid costly probe generation on the low-GPU performance preset.
  if (mode === "off" || mode === "hdri" || quality === "performance") {
    app.scene.envAtlas = null;
    return;
  }
  let atlas = cache.get(mode);
  if (!atlas) {
    let source: any = null;
    let lightingSource: any = null;
    try {
      source = new pc.Texture(app.graphicsDevice, {
        name: `wonderplay-${mode}-probe`,
        width: 512,
        height: 256,
        format: pc.PIXELFORMAT_RGBA8,
        projection: pc.TEXTUREPROJECTION_EQUIRECT,
        // Prefilter the source once so the GPU cubemap conversion can sample
        // mip levels instead of doing 1024 samples for every source pixel.
        mipmaps: true,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
      });
      source.setSource(createEnvironmentProbe(mode));
      lightingSource = pc.EnvLighting.generateLightingSource(source, { size: 64 });
      atlas = pc.EnvLighting.generateAtlas(lightingSource, {
        size: 256,
        numReflectionSamples: 128,
        numAmbientSamples: 256,
      });
      cache.set(mode, atlas);
    } finally {
      lightingSource?.destroy();
      source?.destroy();
    }
  }
  app.scene.envAtlas = atlas;
}

// Deterministic PRNG so hotspot placement is stable across renders
function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Build an equirectangular gradient texture on a 2D canvas
function buildEquirectTexture(
  base: [number, number, number],
  sky: [number, number, number],
  horizon: [number, number, number],
  width = 2048,
  height = 1024,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const data = img.data;

  const lerpRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    lerp(a[0], b[0], t) * 255,
    lerp(a[1], b[1], t) * 255,
    lerp(a[2], b[2], t) * 255,
  ];

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const nv = v * 2 - 1;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const idx = (y * width + x) * 4;

      let color: [number, number, number];
      if (nv > 0.1) {
        const t = Math.pow((nv - 0.1) / 0.9, 0.8);
        color = lerpRgb(horizon, sky, t);
      } else {
        const t = (nv + 1) / 1.1;
        color = lerpRgb(horizon, base, Math.pow(t, 1.6));
      }

      // Sun glow streak near the horizon
      const sunX = 0.72;
      const sunDist = Math.abs(u - sunX) * width;
      const glow = Math.max(0, 1 - sunDist / (width * 0.08));
      color[0] += glow * 255 * 0.35;
      color[1] += glow * 255 * 0.3;
      color[2] += glow * 255 * 0.22;

      // Stars in the sky region
      if (nv > 0.45) {
        const hash = Math.sin(u * 127.1 + v * 311.7) * 43758.5453;
        const frac = hash - Math.floor(hash);
        if (frac > 0.985) {
          const star = (frac - 0.985) * 400;
          color[0] += star;
          color[1] += star;
          color[2] += star;
        }
      }

      data[idx] = Math.min(255, color[0]);
      data[idx + 1] = Math.min(255, color[1]);
      data[idx + 2] = Math.min(255, color[2]);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Build a subtle grid texture for the ground helper
function buildGridTexture(size = 512, divisions = 16, tint = [56, 189, 248]) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(148,163,184,0.14)";
  ctx.lineWidth = 1;
  const cell = size / divisions;
  for (let i = 0; i <= divisions; i++) {
    const p = i * cell;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  // Major axes tinted
  ctx.strokeStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},0.45)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();
  return canvas;
}

function materialFromSpec(pc: any, mat: GeneratedSceneMaterial): any {
  const m = new pc.StandardMaterial();
  if (mat.color) m.diffuse = new pc.Color(mat.color[0], mat.color[1], mat.color[2]);
  m.metalness = mat.metalness ?? 0;
  m.useMetalness = true;
  m.roughness = mat.roughness ?? 0.5;
  if (mat.emissive) m.emissive = new pc.Color(mat.emissive[0], mat.emissive[1], mat.emissive[2]);
  m.update();
  return m;
}

/** Report the material data actually present in an imported GLB. */
function describeImportedPbr(root: any): string {
  const materials = new Set<any>();
  const walk = (entity: any) => {
    for (const instance of entity.render?.meshInstances ?? []) {
      if (instance.material) materials.add(instance.material);
    }
    for (const child of entity.children ?? []) walk(child);
  };
  walk(root);
  if (!materials.size) return "The GLB has no material information PlayCanvas could inspect.";
  const counts = { base: 0, normal: 0, metallic: 0, roughness: 0, emissive: 0 };
  for (const material of materials) {
    if (material.diffuseMap) counts.base++;
    if (material.normalMap) counts.normal++;
    if (material.metalnessMap) counts.metallic++;
    if (material.glossMap) counts.roughness++;
    if (material.emissiveMap) counts.emissive++;
  }
  return `${materials.size} GLB material(s) · color maps ${counts.base} · normals ${counts.normal} · metallic ${counts.metallic} · roughness ${counts.roughness} · emissive ${counts.emissive}. Missing maps are not generated by the renderer.`;
}

const PRIMITIVE_TYPES: Record<string, string> = {
  box: "box",
  sphere: "sphere",
  cylinder: "cylinder",
  plane: "plane",
  capsule: "capsule",
  cone: "cone",
  torus: "torus",
};

// Physics primitives ignore entity scale; specify their full physical size.
function collisionForType(pc: any, type: string, scale?: [number, number, number]) {
  const [sx, sy, sz] = scale ?? [1, 1, 1];
  switch (type) {
    case "sphere":
      return { type: "sphere", radius: Math.max(sx, sy, sz) / 2 };
    case "capsule":
      return { type: "capsule", radius: Math.max(sx, sz) / 2, height: sy };
    case "cylinder":
      return { type: "cylinder", radius: Math.max(sx, sz) / 2, height: sy };
    case "plane":
      // PlayCanvas can render a plane, but its physics engine has no "plane"
      // collision implementation. Use a shallow box across the whole XZ floor.
      return { type: "box", halfExtents: new pc.Vec3(sx / 2, 0.05, sz / 2) };
    case "cone":
      return { type: "cone", radius: Math.max(sx, sz) / 2, height: sy };
    case "box":
    default:
      return { type: "box", halfExtents: new pc.Vec3(sx / 2, sy / 2, sz / 2) };
  }
}

const StudioViewport = forwardRef<StudioViewportHandle, StudioViewportProps>(
  function StudioViewport(
    { onSelect, onEntityCreated, onMeshStatus, onEnvironmentStatus, onReady, className = "", showGizmo = true, showGrid: showGridProp = false, showStats = false, showFps = false },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<any>(null);
    const pcRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const cameraFrameRef = useRef<any>(null);
    const qualityRef = useRef<RenderQuality>("high");
    const environmentRef = useRef<EnvironmentLightingMode>("studio");
    const environmentCacheRef = useRef<Map<EnvironmentPreset, any>>(new Map());
    const hdrUrlRef = useRef("");
    const hdrRevisionRef = useRef(0);
    const hdrAssetRef = useRef<{ url: string; asset: any; atlas: any } | null>(null);
    const hdrPendingRef = useRef<{ url: string; asset: any } | null>(null);
    const toneMappingRef = useRef<ToneMappingMode>("ACES");
    const selectedEntityRef = useRef<any>(null);
    const highlightIdRef = useRef<string | null>(null);
    const orbitRef = useRef({ dist: 9, az: 40, el: 30 });
    const orbitTargetRef = useRef({ x: 0, y: 1, z: 0 });
    const cameraPathRef = useRef<{ enabled: boolean; speed: number; radius: number; targetY: number; lookAt: [number, number, number]; ease: boolean; t: number }>({
      enabled: false,
      speed: 1,
      radius: 9,
      targetY: 1,
      lookAt: [0, 1, 0],
      ease: false,
      t: 0,
    });
    const baseLightsRef = useRef<any[]>([]);
    const groundRef = useRef<any>(null);
    const gridRef = useRef<any>(null);
    const sceneRootRef = useRef<any>(null);
    const sceneSplatAssetsRef = useRef<any[]>([]);
    const actorRootRef = useRef<any>(null);
    const wireframeRef = useRef(false);
    const shadowsRef = useRef(true);
    const framedRadiusRef = useRef<number | null>(null);
    const statsRef = useRef({ fps: 0, entities: 0, frames: 0, lastTime: 0 });
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [stats, setStats] = useState<ViewportStats>({ fps: 0, entities: 0, frames: 0 });
    const onSelectRef = useRef(onSelect);
    const onEntityCreatedRef = useRef(onEntityCreated);
    const onMeshStatusRef = useRef(onMeshStatus);
    const onEnvironmentStatusRef = useRef(onEnvironmentStatus);
    const onReadyRef = useRef(onReady);
    const showGridRef = useRef(showGridProp);
    const showStatsRef = useRef(showStats);

    useEffect(() => {
      onSelectRef.current = onSelect;
      onEntityCreatedRef.current = onEntityCreated;
      onMeshStatusRef.current = onMeshStatus;
      onEnvironmentStatusRef.current = onEnvironmentStatus;
      onReadyRef.current = onReady;
    }, [onSelect, onEntityCreated, onMeshStatus, onEnvironmentStatus, onReady]);

    useEffect(() => {
      showGridRef.current = showGridProp;
    }, [showGridProp]);

    const forEachEntity = useCallback((root: any, fn: (e: any) => void) => {
      const walk = (ent: any) => {
        fn(ent);
        for (const c of ent.children ?? []) walk(c);
      };
      walk(root);
    }, []);

    const disposeHdrEnvironment = useCallback((app: any) => {
      // Changing environments invalidates in-flight HDR downloads and releases
      // the old GPU atlas before creating a different one.
      hdrRevisionRef.current++;
      const previous = hdrAssetRef.current;
      const pending = hdrPendingRef.current;
      hdrAssetRef.current = null;
      hdrPendingRef.current = null;
      if (app?.scene) app.scene.envAtlas = null;
      try {
        previous?.atlas?.destroy();
        previous?.asset?.unload();
        if (previous?.asset) app?.assets?.remove(previous.asset);
        pending?.asset?.unload();
        if (pending?.asset) app?.assets?.remove(pending.asset);
      } catch { /* The graphics context may already be disposed. */ }
    }, []);

    const loadHdrEnvironment = useCallback((rawUrl: string) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const url = normalizeHdrEnvironmentUrl(rawUrl);
      if (!url) {
        // A saved level can select HDRI without a valid URL. Invalidate any
        // previous level's pending download before returning to studio light.
        disposeHdrEnvironment(app);
        onEnvironmentStatusRef.current?.({ state: "error", message: "Use a public Supabase Storage .hdr URL or a same-site .hdr path." });
        updateEnvironmentLighting(app, pc, "studio", qualityRef.current, environmentCacheRef.current);
        return;
      }
      if (qualityRef.current === "performance") {
        disposeHdrEnvironment(app);
        return;
      }
      if (hdrAssetRef.current?.url === url) {
        app.scene.envAtlas = hdrAssetRef.current.atlas;
        return;
      }
      if (hdrPendingRef.current?.url === url) return;

      disposeHdrEnvironment(app);
      // Keep the asset visible with basic reflections while HDR prefiltering is loading.
      updateEnvironmentLighting(app, pc, "studio", qualityRef.current, environmentCacheRef.current);
      const revision = hdrRevisionRef.current;
      const asset = new pc.Asset("WonderPlay HDR environment", "texture", { url });
      const pending = { url, asset };
      hdrPendingRef.current = pending;
      const onFailure = () => {
        if (hdrPendingRef.current !== pending || hdrRevisionRef.current !== revision) return;
        disposeHdrEnvironment(app);
        updateEnvironmentLighting(app, pc, "studio", qualityRef.current, environmentCacheRef.current);
        onEnvironmentStatusRef.current?.({ state: "error", message: "Could not load the HDR environment. Check its URL, format and CORS permissions." });
      };
      asset.on("error", onFailure);
      asset.ready(() => {
        if (hdrPendingRef.current !== pending || hdrRevisionRef.current !== revision) return;
        let lightingSource: any = null;
        try {
          const source = asset.resource;
          if (!source) throw new Error("HDR texture unavailable");
          source.projection = pc.TEXTUREPROJECTION_EQUIRECT;
          lightingSource = pc.EnvLighting.generateLightingSource(source, { size: qualityRef.current === "cinematic" ? 128 : 64 });
          const atlas = pc.EnvLighting.generateAtlas(lightingSource, {
            size: qualityRef.current === "cinematic" ? 512 : 256,
            numReflectionSamples: qualityRef.current === "cinematic" ? 256 : 128,
            numAmbientSamples: 256,
          });
          hdrPendingRef.current = null;
          hdrAssetRef.current = { url, asset, atlas };
          app.scene.envAtlas = atlas;
          onEnvironmentStatusRef.current?.({ state: "loaded", message: "Real HDR image-based lighting is active." });
        } catch (cause) {
          logger.warn("PlayCanvas HDR environment prefilter failed", cause);
          onFailure();
        } finally {
          lightingSource?.destroy();
        }
      });
      try {
        app.assets.add(asset);
        app.assets.load(asset);
      } catch (cause) {
        logger.warn("PlayCanvas HDR environment load failed", cause);
        onFailure();
      }
    }, [disposeHdrEnvironment]);

    const applyRenderQuality = useCallback((quality: RenderQuality) => {
      qualityRef.current = quality;
      const preset = RENDER_QUALITY_PRESETS[quality];
      const app = appRef.current;
      const pc = pcRef.current;
      const camera = cameraRef.current?.camera;
      if (!app || !pc || !camera) return;

      // The engine's default 1x canvas resolution looks soft on HiDPI screens.
      // Let owners trade fidelity against GPU cost without changing delivery.
      const ratio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
      app.graphicsDevice.maxPixelRatio = Math.min(ratio, preset.maxPixelRatio);
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        app.resizeCanvas(Math.max(1, Math.round(bounds.width)), Math.max(1, Math.round(bounds.height)));
      }

      let localShadowLights = 0;
      forEachEntity(app.root, (entity) => {
        if (entity.light?.type === "directional") {
          entity.light.shadowResolution = preset.shadowResolution;
          entity.light.numCascades = preset.cascades;
          entity.light.normalOffsetBias = 0.05;
        } else if (entity.light && ["omni", "spot"].includes(entity.light.type)) {
          // Clustered lighting handles local lights, but shadow-casting is
          // deliberately capped to avoid exhausting mobile GPU memory.
          entity.light.castShadows = shadowsRef.current &&
            localShadowLights++ < preset.localShadowLights;
          entity.light.shadowResolution = preset.shadowResolution;
        }
        for (const instance of entity.render?.meshInstances ?? []) {
          const material = instance.material;
          for (const mapName of ["diffuseMap", "normalMap", "metalnessMap", "glossMap", "aoMap", "emissiveMap", "opacityMap", "heightMap"]) {
            const texture = material?.[mapName];
            if (texture && typeof texture.anisotropy === "number") {
              texture.anisotropy = Math.min(app.graphicsDevice.maxAnisotropy || 1, preset.textureAnisotropy);
            }
          }
        }
      });

      // CameraFrame is optional: WebGL2 is the baseline, and users can always
      // switch to the native forward-rendered performance preset.
      let frame = cameraFrameRef.current;
      if (quality !== "performance") {
        try {
          if (!frame) {
            frame = new pc.CameraFrame(app, camera);
            cameraFrameRef.current = frame;
          }
          frame.enabled = true;
          frame.rendering.samples = preset.msaaSamples;
          frame.rendering.toneMapping = pc[TONE_MAPPING_CONSTANTS[toneMappingRef.current]];
          frame.ssao.type = pc.SSAOTYPE_COMBINE;
          frame.ssao.intensity = preset.ssaoIntensity;
          frame.ssao.samples = preset.ssaoSamples;
          frame.ssao.radius = 1.25;
          frame.taa.enabled = preset.taaEnabled;
          frame.taa.jitter = 0.65;
          frame.rendering.sharpness = preset.sharpness;
          frame.bloom.intensity = preset.bloomIntensity;
          frame.bloom.threshold = 1.5;
          // Color grading and lens falloff are real camera post-processes,
          // not modifications to or fabricated texture maps on user assets.
          frame.grading.enabled = preset.cinematicGrade;
          frame.grading.contrast = preset.cinematicGrade ? 1.07 : 1;
          frame.grading.saturation = preset.cinematicGrade ? 1.05 : 1;
          frame.vignette.intensity = preset.cinematicGrade ? 0.13 : 0;
          frame.vignette.inner = 0.45;
          frame.vignette.outer = 1.25;
          frame.update();
        } catch (cause) {
          logger.warn("Advanced PlayCanvas camera effects are unavailable; using basic rendering", cause);
          if (frame) {
            try { frame.destroy(); } catch { /* failed graphics context */ }
            cameraFrameRef.current = null;
          }
          camera.toneMapping = pc[TONE_MAPPING_CONSTANTS[toneMappingRef.current]];
        }
      } else if (frame) {
        frame.enabled = false;
      }
      camera.gammaCorrection = pc.GAMMA_SRGB;
      camera.toneMapping = pc[TONE_MAPPING_CONSTANTS[toneMappingRef.current]];
      try {
        if (environmentRef.current === "hdri") loadHdrEnvironment(hdrUrlRef.current);
        else updateEnvironmentLighting(app, pc, environmentRef.current, quality, environmentCacheRef.current);
      } catch (cause) {
        // Older GPUs must still be able to preview meshes in basic lighting.
        app.scene.envAtlas = null;
        logger.warn("PlayCanvas environment lighting unavailable; using ambient lighting", cause);
      }
    }, [forEachEntity, loadHdrEnvironment]);

    const setEnvironmentLighting = useCallback((mode: EnvironmentLightingMode, hdrUrl?: string) => {
      environmentRef.current = mode;
      if (hdrUrl !== undefined) hdrUrlRef.current = hdrUrl;
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      try {
        if (mode === "hdri") loadHdrEnvironment(hdrUrlRef.current);
        else {
          if (hdrAssetRef.current || hdrPendingRef.current) disposeHdrEnvironment(app);
          updateEnvironmentLighting(app, pc, mode, qualityRef.current, environmentCacheRef.current);
        }
      } catch (cause) {
        app.scene.envAtlas = null;
        logger.warn("PlayCanvas environment lighting unavailable; using ambient lighting", cause);
      }
    }, [disposeHdrEnvironment, loadHdrEnvironment]);

    const setupRaycastSelection = useCallback((app: any, cameraEntity: any) => {
      if (!app.mouse) return;
      const pc = pcRef.current;
      if (!pc) return;

      app.mouse.on(pc.EVENT_MOUSEDOWN, (event: any) => {
        if (event.button !== 0) return;

        const startX = event.x;
        const startY = event.y;

        const near = cameraEntity.camera.screenToWorld(startX, startY, cameraEntity.camera.nearClip);
        const far = cameraEntity.camera.screenToWorld(startX, startY, cameraEntity.camera.farClip);
        const from = new pc.Vec3(near.x, near.y, near.z);
        const to = new pc.Vec3(far.x, far.y, far.z);
        let result: any = null;
        // Rigid body components can exist before Ammo has been loaded. In
        // that state no physics world is available for raycasting.
        if (app.systems.rigidbody?.dynamicsWorld) {
          result = app.systems.rigidbody.raycastFirst(from, to);
        }
        if (!result) {
          try {
            const picked = app.systems.pick ? app.systems.pick.pick(startX, startY) : null;
            if (picked) result = { entity: picked };
          } catch (err) {
            logger.warn("Pick system error:", err);
          }
        }

        if (result?.entity) {
          const entity = result.entity;
          selectedEntityRef.current = entity;
          const name = entity.name || "untitled";
          const id = typeof entity.getGuid === "function" ? entity.getGuid() : `${name}-${entity.getIndex?.() ?? Date.now()}`;
          const selection: StudioSelection = { name, id, entityId: entity.getIndex?.() };
          window.dispatchEvent(new CustomEvent("onCanvasAssetSelected", { detail: selection }));
          onSelectRef.current?.(selection);

          // Flash a highlight ring: brief emissive boost
          try {
            const renderC = entity.render || entity.model;
            if (renderC && renderC.material) {
              const orig = renderC.material.emissive;
              renderC.material.emissive = new pc.Color(0.3, 0.9, 1);
              renderC.material.emissiveIntensity = 1.5;
              renderC.material.update();
              setTimeout(() => {
                if (renderC.material) {
                  renderC.material.emissive = orig;
                  renderC.material.emissiveIntensity = 0;
                  renderC.material.update();
                }
              }, 400);
            }
          } catch (err) {
            logger.warn("Highlight error:", err);
          }
        } else {
          selectedEntityRef.current = null;
          onSelectRef.current?.({ name: "", id: "" });
        }
      });
    }, []);

    const setupOrbitControls = useCallback((app: any, camera: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      let isDragging = false;
      let panning = false;
      let lastX = 0;
      let lastY = 0;

      const applyCamera = () => {
        const o = orbitRef.current;
        const t = orbitTargetRef.current;
        const rad = (d: number) => d * 0.0174533;
        const phi = rad(o.el);
        const theta = rad(o.az);
        const x = o.dist * Math.sin(phi) * Math.sin(theta) + t.x;
        const y = o.dist * Math.cos(phi) + t.y;
        const z = o.dist * Math.sin(phi) * Math.cos(theta) + t.z;
        camera.setPosition(x, y, z);
        camera.lookAt(t.x, t.y, t.z);
      };

      app.mouse.on(pc.EVENT_MOUSEDOWN, (e: any) => {
        if (e.button === 0) {
          isDragging = true;
          lastX = e.x;
          lastY = e.y;
        } else if (e.button === 2) {
          panning = true;
          lastX = e.x;
          lastY = e.y;
        }
      });

      app.mouse.on(pc.EVENT_MOUSEUP, () => {
        isDragging = false;
        panning = false;
      });

      app.mouse.on(pc.EVENT_MOUSEMOVE, (e: any) => {
        const dx = e.x - lastX;
        const dy = e.y - lastY;
        if (isDragging) {
          const o = orbitRef.current;
          o.az -= dx * 0.4;
          o.el = Math.max(5, Math.min(85, o.el + dy * 0.4));
        } else if (panning) {
          // The orbit loop recomputes the camera transform every frame.
          // Pan its pivot, not its temporary camera transform.
          panOrbitTarget(orbitTargetRef.current, camera.right, camera.up, dx, dy);
        }
        lastX = e.x;
        lastY = e.y;
      });

      app.mouse.on(pc.EVENT_MOUSEWHEEL, (e: any) => {
        const o = orbitRef.current;
        // Model scenes range from small props to entire cities. An absolute
        // 40-unit zoom limit traps the camera inside large imported worlds.
        o.dist = Math.max(0.05, Math.min(100000, o.dist * Math.max(0.2, 1 + e.wheel * 0.06)));
      });

      // Apply orbit on every frame unless a camera path is active
      app.on("update", () => {
        const path = cameraPathRef.current;
        if (path.enabled) {
          path.t += path.speed * 0.016;
          const theta = path.t * 0.35;
          const x = path.radius * Math.sin(theta);
          const z = path.radius * Math.cos(theta);
          camera.setPosition(x, path.targetY, z);
          camera.lookAt(path.lookAt[0], path.lookAt[1], path.lookAt[2]);
        } else {
          applyCamera();
          // Frame distance changes over orders of magnitude when navigating a
          // city. Keep the near plane close while zooming in; preserve enough
          // far distance to see the entire imported environment on zoom-out.
          if (camera.camera) {
            const clip = orbitClipPlanes(orbitRef.current.dist, framedRadiusRef.current ?? 0);
            camera.camera.nearClip = clip.near;
            camera.camera.farClip = clip.far;
          }
        }
      });

      applyCamera();
    }, []);

    const setupGround = useCallback((app: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      const ground = new pc.Entity("Ground");
      ground.addComponent("render", { type: "plane" });
      ground.setLocalScale(20, 1, 20);
      ground.setPosition(0, -0.1, 0);
      const gm = new pc.StandardMaterial();
      gm.diffuse = new pc.Color(0.13, 0.13, 0.16);
      gm.roughness = 0.95;
      gm.metalness = 0;
      gm.update();
      ground.render.material = gm;
      ground.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(10, 0.05, 10) });
      ground.addComponent("rigidbody", { type: "static" });
      app.root.addChild(ground);
      groundRef.current = ground;
      return ground;
    }, []);

    const setupGrid = useCallback((app: any, enabled: boolean) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (gridRef.current) {
        gridRef.current.enabled = enabled;
        return gridRef.current;
      }
      const grid = new pc.Entity("GridHelper");
      grid.addComponent("render", { type: "plane" });
      grid.setLocalScale(20, 1, 20);
      grid.setPosition(0, 0.005, 0);
      grid.render.castShadows = false;
      grid.render.receiveShadows = false;
      const texture = new pc.Texture(app.graphicsDevice, {
        width: 512,
        height: 512,
        format: pc.PIXELFORMAT_R8_G8_B8_A8,
        mipmaps: true,
      });
      texture.setSource(buildGridTexture());
      texture.addressU = pc.ADDRESS_REPEAT;
      texture.addressV = pc.ADDRESS_REPEAT;
      texture.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
      texture.magFilter = pc.FILTER_LINEAR;
      const gm = new pc.StandardMaterial();
      gm.diffuseMap = texture;
      gm.diffuse = new pc.Color(1, 1, 1);
      gm.emissive = new pc.Color(1, 1, 1);
      gm.emissiveMap = texture;
      gm.emissiveIntensity = 0.9;
      gm.opacity = 0.9;
      gm.blendType = pc.BLEND_NORMAL;
      gm.depthWrite = false;
      gm.update();
      grid.render.material = gm;
      app.root.addChild(grid);
      grid.enabled = enabled;
      gridRef.current = grid;
      return grid;
    }, []);

    const setupLights = useCallback((app: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      const dir = new pc.Entity("DirLight");
      dir.addComponent("light", { type: "directional", color: new pc.Color(1, 1, 1), intensity: 1.1, castShadows: true });
      dir.setEulerAngles(45, 30, 0);
      app.root.addChild(dir);

      // Ambient illumination belongs to the scene, not an entity light component.
      // PlayCanvas entity lights only support directional, omni, and spot types.
      app.scene.ambientLight = new pc.Color(0.35, 0.38, 0.5);

      const rim = new pc.Entity("RimLight");
      rim.addComponent("light", { type: "directional", color: new pc.Color(0.2, 0.4, 0.7), intensity: 0.4 });
      rim.setEulerAngles(-30, -120, 0);
      app.root.addChild(rim);

      baseLightsRef.current = [dir, rim];
    }, []);

    // Apply scene-authored lights under the scene root; disable base lights when present
    const applySceneLights = useCallback(
      (scene: GeneratedScene, root: any) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc || !root) return;

        const lights = scene.lights ?? [];
        for (const light of baseLightsRef.current) {
          light.enabled = lights.length === 0;
        }
        if (lights.length === 0) return;

        let localShadowLights = 0;
        for (const light of lights) {
          const entity = new pc.Entity(light.id || "SceneLight");
          const isDir = light.type === "directional";
          // Generated scenes use the generic "point" light name. PlayCanvas
          // calls the equivalent runtime light type "omni".
          const playcanvasLightType = light.type === "point" ? "omni" : light.type;
          entity.addComponent("light", {
            type: playcanvasLightType,
            color: new pc.Color(light.color[0], light.color[1], light.color[2]),
            intensity: light.intensity ?? 1,
            castShadows: shadowsRef.current && (isDir || (qualityRef.current !== "performance" &&
              localShadowLights++ < (qualityRef.current === "cinematic" ? 4 : 2))),
          });

          if (isDir) {
            const d = light.direction ?? [0, -1, 0];
            const direction = new pc.Vec3(d[0], d[1], d[2]);
            if (direction.lengthSq() > 1e-8) {
              direction.normalize();
              // PlayCanvas lights emit along local -Y, not camera-style -Z.
              entity.setRotation(new pc.Quat().setFromDirections(pc.Vec3.DOWN, direction));
            }
          } else {
            if (light.position) entity.setPosition(light.position[0], light.position[1], light.position[2]);
          }
          root.addChild(entity);
        }
      },
      [],
    );

    const setupStatsLoop = useCallback((app: any) => {
      const now = performance.now();
      statsRef.current.lastTime = now;
      app.on("update", () => {
        statsRef.current.frames++;
        const t = performance.now();
        if (t - statsRef.current.lastTime >= 1000) {
          statsRef.current.fps = statsRef.current.frames;
          statsRef.current.frames = 0;
          statsRef.current.lastTime = t;

          let count = 0;
          const walk = (ent: any) => {
            count++;
            for (const c of ent.children ?? []) walk(c);
          };
          walk(app.root);
          statsRef.current.entities = count;
          if (showStatsRef.current) {
            setStats({ fps: statsRef.current.fps, entities: count, frames: 0 });
          }
        }
      });
    }, []);

    const handleRemoteMeshInjection = useCallback((e: Event) => {
      const customEvent = e as CustomEvent;
      const { gltfUrl, assetId } = customEvent.detail ?? {};
      const app = appRef.current;
      if (!app || !gltfUrl) return;

      app.assets.loadFromUrl(gltfUrl, "container", (err: Error | null, asset: any) => {
        if (err) {
          logger.error("PlayCanvas GLTF Loading Error:", err);
          onMeshStatusRef.current?.({ objectId: String(assetId ?? "remote-model"), state: "error", message: "GLB model failed to load." });
          return;
        }
        const pc = pcRef.current;
        if (!pc || !asset?.resource?.instantiateRenderEntity) {
          logger.warn("PlayCanvas injection did not return a GLB container", { assetId });
          onMeshStatusRef.current?.({ objectId: String(assetId ?? "remote-model"), state: "error", message: "GLB did not contain a renderable model." });
          return;
        }
        const targetEntity = new pc.Entity(`AI_Asset_${assetId ?? Date.now()}`);
        // GLB loaders return a container resource, not a legacy Model asset.
        // Keep the authored mesh hierarchy, normals and PBR texture maps.
        const imported = asset.resource.instantiateRenderEntity({ castShadows: shadowsRef.current });
        targetEntity.addChild(imported);
        forEachEntity(imported, (part) => {
          if (part.render) part.render.castShadows = shadowsRef.current;
          for (const instance of part.render?.meshInstances ?? []) {
            // A model injected after initial setup should get the same oblique
            // texture clarity as models loaded by the normal editor path.
            const material = instance.material;
            for (const mapName of ["diffuseMap", "normalMap", "metalnessMap", "glossMap", "aoMap", "emissiveMap"]) {
              const texture = material?.[mapName];
              if (texture && typeof texture.anisotropy === "number") {
                texture.anisotropy = Math.min(app.graphicsDevice.maxAnisotropy || 1,
                  RENDER_QUALITY_PRESETS[qualityRef.current].textureAnisotropy);
              }
            }
          }
        });
        targetEntity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(0.5, 0.5, 0.5) });
        targetEntity.addComponent("rigidbody", { type: "static" });
        app.root.addChild(targetEntity);
        selectedEntityRef.current = targetEntity;
        onEntityCreatedRef.current?.({ name: targetEntity.name, id: `${assetId ?? Date.now()}` });
        onMeshStatusRef.current?.({ objectId: String(assetId ?? "remote-model"), state: "loaded", message: describeImportedPbr(imported) });
      });
    }, [forEachEntity]);

    useEffect(() => {
      let disposed = false;
      let app: any = null;
      let device: any = null;

      async function init() {
        try {
          const playcanvas = await import("playcanvas");
          if (disposed || !containerRef.current || !canvasRef.current) return;
          const pc = playcanvas;
          pcRef.current = pc;
          // Like PlayCanvas React's PhysicsProvider, install Ammo before the
          // Application creates its rigidbody system. The dependency is bundled
          // with the site so production physics needs no third-party CDN.
          if (!(globalThis as typeof globalThis & { Ammo?: unknown }).Ammo) {
            const ammoModule = await import("sync-ammo");
            // The package's TypeScript declaration exposes a CommonJS module,
            // while browser bundlers may wrap that module in an ESM default.
            (globalThis as typeof globalThis & { Ammo?: unknown }).Ammo =
              "default" in ammoModule && ammoModule.default ? ammoModule.default : ammoModule;
          }
          if (disposed) return;
          const canvas = canvasRef.current;
          // Create a real PlayCanvas WebGL2 device; do not claim the canvas
          // context before the engine can initialize it.
          device = await pc.createGraphicsDevice(canvas, {
            deviceTypes: [pc.DEVICETYPE_WEBGL2],
            antialias: true,
          });
          if (disposed) {
            device.destroy();
            device = null;
            return;
          }
          app = new pc.Application(canvas, {
            graphicsDevice: device,
            mouse: new pc.Mouse(canvas),
            touch: new pc.TouchDevice(canvas),
            elementInput: new pc.ElementInput(canvas),
          });
          appRef.current = app;
          app.start();
          app.systems.rigidbody.gravity = new pc.Vec3(0, -9.81, 0);

          const camera = new pc.Entity("Camera");
          camera.addComponent("camera", {
            clearColor: new pc.Color(0.07, 0.07, 0.12),
            fov: 50,
            nearClip: 0.1,
            farClip: 10000,
          });
          app.root.addChild(camera);
          cameraRef.current = camera;

          setupLights(app);
          setupGround(app);
          setupGrid(app, showGridProp);
          applyRenderQuality(qualityRef.current);
          setupOrbitControls(app, camera);
          setupRaycastSelection(app, camera);
          setupStatsLoop(app);

          const resize = () => {
            if (containerRef.current && canvasRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              app.resizeCanvas(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)));
            }
          };
          resize();
          window.addEventListener("resize", resize);
          (app as any)._resizeHandler = resize;
          const resizeObserver = new ResizeObserver(resize);
          resizeObserver.observe(containerRef.current);
          (app as any)._resizeObserver = resizeObserver;

          window.addEventListener("injectRemoteAiModel", handleRemoteMeshInjection);
          (app as any)._injectHandler = handleRemoteMeshInjection;

          setReady(true);
          onReadyRef.current?.();
        } catch (err: any) {
          if (!disposed) setError(err instanceof Error ? err.message : "WebGL2 could not start");
          if (!app && device) device.destroy();
        }
      }

      void init();

      return () => {
        disposed = true;
        if (app) {
          window.removeEventListener("resize", (app as any)._resizeHandler);
          (app as any)._resizeObserver?.disconnect();
          window.removeEventListener("injectRemoteAiModel", (app as any)._injectHandler);
          cameraFrameRef.current?.destroy();
          cameraFrameRef.current = null;
          disposeHdrEnvironment(app);
          app.scene.envAtlas = null;
          for (const atlas of environmentCacheRef.current.values()) atlas.destroy();
          environmentCacheRef.current.clear();
          sceneSplatAssetsRef.current = [];
          app.destroy();
        } else if (device) {
          device.destroy();
        }
        appRef.current = null;
        pcRef.current = null;
      };
    }, [applyRenderQuality, disposeHdrEnvironment, handleRemoteMeshInjection, setupGround, setupGrid, setupLights, setupOrbitControls, setupRaycastSelection, setupStatsLoop, showGridProp]);

    const renderScene = useCallback((scene: GeneratedScene) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;

      const existing = app.root.findByName("__sceneRoot");
      if (existing) existing.destroy();
      for (const asset of sceneSplatAssetsRef.current) {
        app.assets.remove(asset);
        asset.unload();
      }
      sceneSplatAssetsRef.current = [];
      framedRadiusRef.current = null;
      if (cameraRef.current?.camera) {
        cameraRef.current.camera.nearClip = 0.1;
        cameraRef.current.camera.farClip = 10000;
      }
      if (groundRef.current) groundRef.current.enabled = !(scene.objects ?? []).some((object) => object.frameOnLoad);
      const root = new pc.Entity("__sceneRoot");
      app.root.addChild(root);
      sceneRootRef.current = root;

      const materialCache = new Map<string, any>();
      for (const mat of scene.materials ?? []) {
        materialCache.set(mat.id, materialFromSpec(pc, mat));
      }

      for (const obj of scene.objects ?? []) {
        const entity = new pc.Entity(obj.name || "object");
        const renderType = PRIMITIVE_TYPES[obj.type] ?? "box";
        // Never substitute a cube for a missing or still-loading AI GLB.
        if (!obj.assetId) entity.addComponent("render", { type: renderType });

        if (obj.position) entity.setPosition(obj.position[0], obj.position[1], obj.position[2]);
        if (obj.rotation) entity.setEulerAngles(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
        if (obj.scale) entity.setLocalScale(obj.scale[0], obj.scale[1], obj.scale[2]);

        if (entity.render && obj.material && materialCache.has(obj.material)) {
          entity.render.material = materialCache.get(obj.material);
        }

        // Gaussian splats are appearance, not triangle meshes. A box physics
        // body would invent invisible collision geometry around the image.
        if (!obj.splatUrl) {
          const coll = collisionForType(pc, obj.type, obj.scale);
          entity.addComponent("collision", coll);
          if (obj.physics?.type) {
            entity.addComponent("rigidbody", {
              type: obj.physics.type,
              mass: obj.physics.mass ?? (obj.physics.type === "dynamic" ? 1 : 0),
              friction: obj.physics.friction ?? 0.6,
              restitution: obj.physics.restitution ?? 0.1,
            });
          } else {
            entity.addComponent("rigidbody", { type: "static" });
          }
        }

        root.addChild(entity);

        // SOG/PLY splats use PlayCanvas's native Gaussian renderer, not a
        // container/GLB loader or a remote iframe.
        if (obj.splatUrl) {
          const asset = new pc.Asset(obj.name || "Gaussian splat", "gsplat", { url: obj.splatUrl });
          sceneSplatAssetsRef.current.push(asset);
          app.assets.add(asset);
          asset.once("error", (cause: unknown) => {
            if (entity.parent !== root) return;
            logger.warn("PlayCanvas Gaussian splat loading failed", { objectId: obj.id, error: cause });
            onMeshStatusRef.current?.({ objectId: obj.id, state: "error", message: "The Gaussian splat could not be loaded. Check its format or refresh the signed asset URL." });
          });
          asset.ready(() => {
            if (entity.parent !== root) return;
            try {
              entity.addComponent("gsplat", { asset });
              if (obj.frameOnLoad) {
                const bounds = asset.resource?.aabb;
                if (bounds?.center && bounds?.halfExtents) {
                  const c = bounds.center;
                  const h = bounds.halfExtents;
                  const scale = obj.scale ?? [1, 1, 1];
                  const center = entity.getWorldTransform().transformPoint(c.clone());
                  const radius = Math.max(0.25, Math.hypot(h.x * scale[0], h.y * scale[1], h.z * scale[2]));
                  const camera = cameraRef.current;
                  const aspect = Math.max(0.1, (containerRef.current?.clientWidth || 1) / (containerRef.current?.clientHeight || 1));
                  const distance = fitOrbitDistance(radius, camera?.camera?.fov ?? 60, aspect);
                  framedRadiusRef.current = radius;
                  orbitTargetRef.current = { x: center.x, y: center.y, z: center.z };
                  orbitRef.current = { az: 40, el: 65, dist: distance };
                  if (camera?.camera) {
                    const clip = orbitClipPlanes(distance, radius);
                    camera.camera.nearClip = clip.near;
                    camera.camera.farClip = clip.far;
                  }
                }
              }
              onMeshStatusRef.current?.({ objectId: obj.id, state: "loaded" });
            } catch (cause) {
              logger.warn("PlayCanvas Gaussian splat instantiation failed", cause);
              onMeshStatusRef.current?.({ objectId: obj.id, state: "error", message: "PlayCanvas could not render this Gaussian splat." });
            }
          });
          app.assets.load(asset);
        } else if (obj.meshUrl) {
          app.assets.loadFromUrl(obj.meshUrl, "container", (err: Error | null, asset: any) => {
            // A different scene may have replaced this one while the GLB was
            // loading. Never attach a late callback into an obsolete world.
            if (entity.parent !== root) return;
            if (err || !asset?.resource?.instantiateRenderEntity) {
              logger.warn("Failed to load PlayCanvas GLB geometry", { objectId: obj.id, error: err });
              onMeshStatusRef.current?.({
                objectId: obj.id,
                state: "error",
                message: "The 3D model could not be displayed. Refresh its project asset and try again.",
              });
              return;
            }
            try {
              // Container assets are scene hierarchies, not a Model asset ID.
              // instantiateRenderEntity keeps the GLB's meshes and materials.
              const imported = asset.resource.instantiateRenderEntity({ castShadows: shadowsRef.current });
              if (entity.render) entity.removeComponent("render");
              entity.addChild(imported);
              forEachEntity(imported, (part) => {
                if (part.render) part.render.castShadows = shadowsRef.current;
                for (const instance of part.render?.meshInstances ?? []) {
                  // Preserve authored glTF PBR maps and normals. Increase
                  // oblique texture clarity without replacing any materials.
                  const material = instance.material;
                  for (const mapName of ["diffuseMap", "normalMap", "metalnessMap", "glossMap", "aoMap", "emissiveMap", "opacityMap", "heightMap"]) {
                    const texture = material?.[mapName];
                    if (texture && typeof texture.anisotropy === "number") {
                      texture.anisotropy = Math.min(app.graphicsDevice.maxAnisotropy || 1, qualityRef.current === "performance" ? 4 : 16);
                    }
                  }
                }
              });
              if (obj.frameOnLoad) {
                // Frame the actual mesh AABB, not a 1-unit placeholder cube.
                // Real user GLBs may contain city-scale geometry or tiny props.
                const min = new pc.Vec3(Infinity, Infinity, Infinity);
                const max = new pc.Vec3(-Infinity, -Infinity, -Infinity);
                forEachEntity(imported, (part) => {
                  for (const mesh of part.render?.meshInstances ?? []) {
                    const bounds = mesh.aabb;
                    if (!bounds) continue;
                    const c = bounds.center;
                    const h = bounds.halfExtents;
                    min.x = Math.min(min.x, c.x - h.x);
                    min.y = Math.min(min.y, c.y - h.y);
                    min.z = Math.min(min.z, c.z - h.z);
                    max.x = Math.max(max.x, c.x + h.x);
                    max.y = Math.max(max.y, c.y + h.y);
                    max.z = Math.max(max.z, c.z + h.z);
                  }
                });
                if (Number.isFinite(min.x) && Number.isFinite(max.x)) {
                  const center = new pc.Vec3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
                  const radius = Math.max(0.25, Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z) / 2);
                  framedRadiusRef.current = radius;
                  const camera = cameraRef.current;
                  const aspect = Math.max(0.1, (containerRef.current?.clientWidth || 1) / (containerRef.current?.clientHeight || 1));
                  const distance = fitOrbitDistance(radius, camera?.camera?.fov ?? 60, aspect);
                  orbitTargetRef.current = { x: center.x, y: center.y, z: center.z };
                  orbitRef.current = { az: 40, el: 65, dist: distance };
                  if (camera?.camera) {
                    const clip = orbitClipPlanes(distance, radius);
                    camera.camera.nearClip = clip.near;
                    camera.camera.farClip = clip.far;
                  }
                  forEachEntity(app.root, (part) => {
                    if (part.light?.type === "directional") {
                      part.light.shadowDistance = Math.max(100, Math.min(3000, radius * 2));
                    }
                  });
                }
              }
              if (wireframeRef.current) {
                forEachEntity(imported, (e) => {
                  for (const instance of e.render?.meshInstances ?? []) {
                    instance.renderStyle = pc.RENDERSTYLE_WIREFRAME;
                  }
                });
              }
              onMeshStatusRef.current?.({ objectId: obj.id, state: "loaded", message: describeImportedPbr(imported) });
            } catch (cause) {
              logger.warn("PlayCanvas GLB instantiation failed", cause);
              onMeshStatusRef.current?.({
                objectId: obj.id, state: "error",
                message: "The GLB could not be instantiated in PlayCanvas.",
              });
            }
          });
        } else if (obj.assetId) {
          onMeshStatusRef.current?.({
            objectId: obj.id,
            state: "error",
            message: "This saved 3D asset is not accessible in the selected project.",
          });
        }
      }

      // Apply scene-authored lights (real light rig from the generated scene)
      applySceneLights(scene, root);

      // Apply scene camera
      const cam = cameraRef.current;
      if (cam && scene.camera) {
        cameraPathRef.current.enabled = false;
        cam.camera.fov = scene.camera.fov ?? 50;
        const p = scene.camera.position ?? [0, 5, 10];
        const target = scene.camera.target ?? [0, 1, 0];
        orbitTargetRef.current = { x: target[0], y: target[1], z: target[2] };
        orbitRef.current = orbitFromCameraPosition(p, target);
        cam.setPosition(p[0], p[1], p[2]);
        if (Math.hypot(p[0] - target[0], p[1] - target[1], p[2] - target[2]) > 1e-6) {
          cam.lookAt(target[0], target[1], target[2]);
        }
      }

      // Apply sky
      if (scene.sky?.color) {
        cam.camera.clearColor = new pc.Color(scene.sky.color[0], scene.sky.color[1], scene.sky.color[2]);
      }
    }, [applySceneLights, forEachEntity]);

    const clearScene = useCallback(() => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const existing = app.root.findByName("__sceneRoot");
      if (existing) existing.destroy();
      for (const asset of sceneSplatAssetsRef.current) {
        app.assets.remove(asset);
        asset.unload();
      }
      sceneSplatAssetsRef.current = [];
      framedRadiusRef.current = null;
      if (groundRef.current) groundRef.current.enabled = true;
      sceneRootRef.current = null;
      for (const light of baseLightsRef.current) light.enabled = true;
      const cam = cameraRef.current;
      if (cam) {
        cam.camera.fov = 50;
        cam.camera.clearColor = new pc.Color(0.07, 0.07, 0.12);
        cameraPathRef.current.enabled = false;
        orbitRef.current = { dist: 9, az: 40, el: 30 };
        orbitTargetRef.current = { x: 0, y: 1, z: 0 };
      }
    }, []);

    const injectModel = useCallback((gltfUrl: string, assetId?: string) => {
      window.dispatchEvent(new CustomEvent("injectRemoteAiModel", { detail: { gltfUrl, assetId } }));
    }, []);

    const renderPanorama = useCallback(
      (opts?: PanoramaOpts) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;

        const existing = app.root.findByName("__sceneRoot");
        if (existing) existing.destroy();
        for (const asset of sceneSplatAssetsRef.current) {
          app.assets.remove(asset);
          asset.unload();
        }
        sceneSplatAssetsRef.current = [];
        const root = new pc.Entity("__sceneRoot");
        app.root.addChild(root);
        sceneRootRef.current = root;

        const base = opts?.baseColor ?? [0.12, 0.3, 0.45];
        const sky = opts?.skyColor ?? [0.05, 0.1, 0.25];
        const horizon = opts?.horizonColor ?? [0.5, 0.42, 0.35];

        const applyTextureToSphere = (sphere: any, source: any) => {
          const texture = new pc.Texture(app.graphicsDevice, {
            width: source.width || 2048,
            height: source.height || 1024,
            format: pc.PIXELFORMAT_R8_G8_B8_A8,
            mipmaps: true,
          });
          texture.setSource(source);
          texture.addressU = pc.ADDRESS_REPEAT;
          texture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
          texture.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
          texture.magFilter = pc.FILTER_LINEAR;
          texture.anisotropy = 8;

          const mat = sphere.render.material;
          mat.diffuseMap = texture;
          mat.emissiveMap = texture;
          mat.diffuse = new pc.Color(1, 1, 1);
          mat.update();
        };

        const sphere = new pc.Entity("PanoramaSphere");
        sphere.addComponent("render", { type: "sphere" });
        sphere.setLocalScale(60, 60, 60);
        sphere.setPosition(0, 0, 0);

        const mat = new pc.StandardMaterial();
        mat.emissive = new pc.Color(1, 1, 1);
        mat.emissiveIntensity = opts?.exposure ?? 1.0;
        mat.lightMap = null;
        mat.diffuse = new pc.Color(1, 1, 1);
        mat.update();
        sphere.render.material = mat;
        sphere.render.castShadows = false;
        sphere.render.receiveShadows = false;
        root.addChild(sphere);

        // Procedural gradient fallback (always create, replaced if skyboxUrl loads)
        const procedural = buildEquirectTexture(base, sky, horizon);
        applyTextureToSphere(sphere, procedural);

        // If a real equirect image URL is given, load and apply it
        if (opts?.skyboxUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => applyTextureToSphere(sphere, img);
          img.onerror = () => logger.warn("Failed to load skybox image:", opts.skyboxUrl);
          img.src = opts.skyboxUrl;
        }

        // Hotspot markers on the panorama sphere
        const count = opts?.hotspotCount ?? 6;
        const radius = opts?.hotspotRadius ?? 5;
        const rand = seededRandom(1337 + count);
        for (let i = 0; i < count; i++) {
          const phi = rand() * Math.PI * 2;
          const theta = (rand() * 0.6 + 0.2) * Math.PI;
          const x = radius * Math.sin(theta) * Math.cos(phi);
          const y = radius * Math.cos(theta) + 1.6;
          const z = radius * Math.sin(theta) * Math.sin(phi);

          const marker = new pc.Entity(`Hotspot_${i + 1}`);
          marker.addComponent("render", { type: "sphere" });
          marker.setLocalScale(0.3, 0.3, 0.3);
          marker.setPosition(x, y, z);
          const mm = new pc.StandardMaterial();
          mm.diffuse = new pc.Color(1, 0.6, 0.15);
          mm.emissive = new pc.Color(1, 0.5, 0.1);
          mm.emissiveIntensity = 1.2;
          mm.update();
          marker.render.material = mm;
          marker.render.castShadows = false;
          marker.addComponent("collision", { type: "sphere", radius: 0.3 });
          marker.addComponent("rigidbody", { type: "static" });
          root.addChild(marker);
        }

        const cam = cameraRef.current;
        if (cam) {
          cameraPathRef.current.enabled = false;
          cam.camera.fov = opts?.fov ?? 90;
          cam.camera.clearColor = new pc.Color(0.02, 0.02, 0.04);
          cam.setPosition(0, 1.6, 0.01);
          cam.lookAt(0, 1.6, 0);
        }
        orbitRef.current = orbitFromCameraPosition([0, 1.6, 0.01], [0, 1.6, 0]);
        orbitTargetRef.current = { x: 0, y: 1.6, z: 0 };
      },
      [],
    );

    const clearPanorama = useCallback(() => {
      clearScene();
    }, [clearScene]);

    const setToneMapping = useCallback((mode: ToneMappingMode) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const constName = TONE_MAPPING_CONSTANTS[mode];
      const value = (pc as any)[constName];
      if (value !== undefined) {
        toneMappingRef.current = mode;
        // Modern PlayCanvas applies display transforms per camera. Linear
        // tonemapping still needs sRGB output on ordinary displays.
        if (cameraRef.current?.camera) {
          cameraRef.current.camera.toneMapping = value;
          cameraRef.current.camera.gammaCorrection = pc.GAMMA_SRGB;
        }
        if (cameraFrameRef.current?.enabled) {
          cameraFrameRef.current.rendering.toneMapping = value;
          cameraFrameRef.current.update();
        }
      }
    }, []);

    const setExposure = useCallback((value: number) => {
      const app = appRef.current;
      if (!app) return;
      app.scene.exposure = value;
      const root = app.root.findByName("__sceneRoot");
      if (root) {
        const sphere = root.findByName("PanoramaSphere");
        if (sphere?.render?.material) {
          sphere.render.material.emissiveIntensity = value;
          sphere.render.material.update();
        }
      }
    }, []);

    const setFov = useCallback((fov: number) => {
      const cam = cameraRef.current;
      if (cam) cam.camera.fov = fov;
    }, []);

    const placeActor = useCallback(
      (opts: { name: string; type: string; x: number; y: number }) => {
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;

        if (!actorRootRef.current || !app.root.findByName("__actorRoot")) {
          const existing = app.root.findByName("__actorRoot");
          if (existing) existing.destroy();
          const actorRoot = new pc.Entity("__actorRoot");
          app.root.addChild(actorRoot);
          actorRootRef.current = actorRoot;
        }

        const typeMap: Record<string, string> = {
          System_Player_Rig: "box",
          Dynamic_Enemy_AI: "cone",
          Physics_Item_Crate: "box",
          Trigger_Zone_Volume: "sphere",
        };
        const renderType = typeMap[opts.type] ?? "box";
        const entity = new pc.Entity(opts.name || `Actor_${opts.x}_${opts.y}`);
        entity.addComponent("render", { type: renderType });
        const worldX = (opts.x / 12) * 20 - 10;
        const worldZ = (opts.y / 12) * 20 - 10;
        entity.setPosition(worldX, opts.type === "Physics_Item_Crate" ? 0.5 : 0.8, worldZ);
        entity.setLocalScale(0.8, 0.8, 0.8);

        const colors: Record<string, [number, number, number]> = {
          System_Player_Rig: [0.2, 0.6, 1],
          Dynamic_Enemy_AI: [1, 0.3, 0.3],
          Physics_Item_Crate: [0.7, 0.5, 0.2],
          Trigger_Zone_Volume: [0.3, 1, 0.6],
        };
        const mat = new pc.StandardMaterial();
        const c = colors[opts.type] ?? [0.5, 0.5, 0.8];
        mat.diffuse = new pc.Color(c[0], c[1], c[2]);
        mat.emissive = new pc.Color(c[0] * 0.3, c[1] * 0.3, c[2] * 0.3);
        mat.update();
        entity.render.material = mat;

        entity.addComponent("collision", { type: "box", halfExtents: new pc.Vec3(0.4, 0.4, 0.4) });
        if (opts.type === "Physics_Item_Crate" || opts.type === "Dynamic_Enemy_AI") {
          entity.addComponent("rigidbody", { type: "dynamic", mass: 1, friction: 0.6 });
        } else if (opts.type !== "Trigger_Zone_Volume") {
          entity.addComponent("rigidbody", { type: "static" });
        }
        actorRootRef.current.addChild(entity);
        onEntityCreatedRef.current?.({ name: entity.name, id: `${opts.x}-${opts.y}` });
        return entity;
      },
      [onEntityCreatedRef],
    );

    const clearActors = useCallback(() => {
      const app = appRef.current;
      if (!app) return;
      const existing = app.root.findByName("__actorRoot");
      if (existing) existing.destroy();
      actorRootRef.current = null;
    }, []);

    const animateCameraPath = useCallback((opts: CameraPathOpts) => {
      cameraPathRef.current = {
        enabled: opts.enabled,
        speed: opts.speed ?? 1,
        radius: opts.radius ?? 9,
        targetY: opts.targetY ?? 1,
        lookAt: opts.lookAt ?? [0, 1, 0],
        ease: opts.ease ?? false,
        t: cameraPathRef.current.t,
      };
    }, []);

    const highlightEntity = useCallback((id: string | null) => {
      highlightIdRef.current = id;
    }, []);

    const captureSnapshot = useCallback((): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL("image/png");
    }, []);

    const setWireframe = useCallback(
      (enabled: boolean) => {
        wireframeRef.current = enabled;
        const app = appRef.current;
        const pc = pcRef.current;
        if (!app || !pc) return;
        const roots = [app.root.findByName("__sceneRoot"), app.root.findByName("__actorRoot")].filter(Boolean);
        const style = enabled ? pc.RENDERSTYLE_WIREFRAME : pc.RENDERSTYLE_SOLID;
        for (const root of roots) {
          forEachEntity(root, (e) => {
            const comp = e.render || e.model;
            if (comp?.meshInstances) {
              comp.meshInstances.forEach((mi: any) => (mi.renderStyle = style));
            }
          });
        }
      },
      [forEachEntity],
    );

    const setShadows = useCallback((enabled: boolean) => {
      shadowsRef.current = enabled;
      const app = appRef.current;
      if (!app) return;
      let localShadowLights = 0;
      forEachEntity(app.root, (e) => {
        if (e.light) {
          e.light.castShadows = enabled && (e.light.type === "directional" ||
            (qualityRef.current !== "performance" && localShadowLights++ <
              (qualityRef.current === "cinematic" ? 4 : 2)));
        }
        if (e.render) e.render.castShadows = enabled;
      });
    }, [forEachEntity]);

    const setAmbient = useCallback((color: [number, number, number], intensity?: number) => {
      const app = appRef.current;
      const pc = pcRef.current;
      if (!app || !pc) return;
      const level = intensity ?? 1;
      app.scene.ambientLight = new pc.Color(color[0] * level, color[1] * level, color[2] * level);
    }, []);

    const focusOn = useCallback((id: string | null) => {
      const app = appRef.current;
      if (!app) return;
      if (!id) {
        orbitTargetRef.current = { x: 0, y: 1, z: 0 };
        return;
      }
      const target = app.root.findByGuid(id);
      if (target) {
        const pos = target.getPosition();
        orbitTargetRef.current = { x: pos.x, y: pos.y + 1, z: pos.z };
        orbitRef.current = { ...orbitRef.current, dist: 6 };
      }
    }, []);

    const getStats = useCallback((): ViewportStats => {
      return { fps: statsRef.current.fps, entities: statsRef.current.entities, frames: statsRef.current.frames };
    }, []);

    const setShowGrid = useCallback((enabled: boolean) => {
      showGridRef.current = enabled;
      const app = appRef.current;
      if (app) {
        if (!gridRef.current) setupGrid(app, enabled);
        else gridRef.current.enabled = enabled;
      }
    }, [setupGrid]);

    useImperativeHandle(ref, () => ({
      renderScene,
      clearScene,
      injectModel,
      getApp: () => appRef.current,
      getPc: () => pcRef.current,
      renderPanorama,
      clearPanorama,
      setToneMapping,
      setExposure,
      setFov,
      placeActor,
      clearActors,
      animateCameraPath,
      highlightEntity,
      captureSnapshot,
      setWireframe,
      setShadows,
      setAmbient,
      focusOn,
      getStats,
      setShowGrid,
      setRenderQuality: applyRenderQuality,
      setEnvironmentLighting,
    }));

    const showStatsUi = showStats || showFps;

    return (
      <div ref={containerRef} className={`relative overflow-hidden bg-[radial-gradient(ellipse_at_center,#1e293b,#020617)] ${className}`}>
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

        {showStatsUi && (
          <div className="pointer-events-none absolute top-2 right-2 flex flex-col items-end space-y-1 text-[10px] font-mono text-emerald-400/80 bg-slate-950/70 backdrop-blur border border-slate-800/60 px-2.5 py-1.5 rounded-lg">
            <span className="text-slate-500 text-[9px] tracking-widest">VIEWPORT STATS</span>
            <span>FPS {stats.fps}</span>
            <span>ENTITIES {stats.entities}</span>
          </div>
        )}

        {showGizmo && ready && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-end space-y-1 text-[10px] font-mono text-white/30">
            <span>+Y</span>
            <div className="flex items-center space-x-1">
              <span>+Z</span>
              <span className="px-1 py-0.5 rounded bg-white/5 text-white/50">drag orbit · wheel zoom · r-click pan</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  },
);

export default StudioViewport;
