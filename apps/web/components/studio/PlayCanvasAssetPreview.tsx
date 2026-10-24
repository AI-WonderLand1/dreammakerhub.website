"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StudioViewport, { type RenderQuality, type StudioViewportHandle } from "@/components/studio/StudioViewport";
import { preferredAssetPreviewQuality } from "@/lib/scene/render-quality";
import type { GeneratedScene } from "@/lib/scene/generateScene";

/** The generator and the game editor now preview with the same PlayCanvas renderer. */
export default function PlayCanvasAssetPreview({ url, name, format = "glb" }: {
  url: string; name: string; format?: "glb" | "sog" | "ply";
}) {
  const viewport = useRef<StudioViewportHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<RenderQuality>("high");

  useEffect(() => {
    const preferred = preferredAssetPreviewQuality(window.innerWidth);
    setQuality(preferred);
  }, []);

  useEffect(() => {
    viewport.current?.setRenderQuality(quality);
  }, [quality]);
  const scene = useMemo<GeneratedScene>(() => ({
    name: "Generated model preview",
    description: "Native PlayCanvas preview of the saved AI asset",
    objects: [{
      id: "generated-model", name, type: "box",
      meshUrl: format === "glb" ? url : "",
      splatUrl: format === "glb" ? "" : url,
      assetId: "generated-model", frameOnLoad: true,
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    }],
    materials: [],
    lights: [
      { id: "key", type: "directional", color: [1, 0.96, 0.91], intensity: 2, direction: [-0.6, -1, -0.5] },
      { id: "fill", type: "point", color: [0.52, 0.72, 1], intensity: 1.5, position: [4, 5, 3] },
    ],
    camera: { position: [2, 1.8, 4], target: [0, 0, 0], fov: 55 },
    sky: { type: "color", color: [0.04, 0.06, 0.1] },
  }), [url, name, format]);

  useEffect(() => {
    setError(null);
    viewport.current?.renderScene(scene);
  }, [scene]);

  return (
    <div className="relative h-full w-full">
      <StudioViewport ref={viewport} showGizmo={false} showGrid={false} className="h-full w-full"
        onReady={() => {
          viewport.current?.setRenderQuality(quality);
          viewport.current?.setEnvironmentLighting("studio");
          viewport.current?.renderScene(scene);
        }}
        onMeshStatus={(detail) => setError(detail.state === "error" ? detail.message || "Model could not load" : null)}
      />
      <label className="absolute right-3 top-3 z-10 rounded-lg border border-slate-600/70 bg-slate-950/85 px-2 py-1 text-[11px] text-slate-200 shadow-lg backdrop-blur">
        <span className="mr-2">Graphics</span>
        <select aria-label="3D model rendering quality" value={quality}
          onChange={(event) => setQuality(event.target.value as RenderQuality)}
          className="bg-transparent text-cyan-200 outline-none">
          <option value="performance" className="bg-slate-950">Performance</option>
          <option value="high" className="bg-slate-950">High</option>
          <option value="cinematic" className="bg-slate-950">Cinematic</option>
        </select>
      </label>
      {error && <p role="alert" className="absolute bottom-4 left-4 right-4 rounded bg-red-950/90 p-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}
