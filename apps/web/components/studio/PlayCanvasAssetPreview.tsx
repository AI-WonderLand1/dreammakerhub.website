"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene } from "@/lib/scene/generateScene";

/** The generator and the game editor now preview with the same PlayCanvas renderer. */
export default function PlayCanvasAssetPreview({ url, name, format = "glb" }: {
  url: string; name: string; format?: "glb" | "sog" | "ply";
}) {
  const viewport = useRef<StudioViewportHandle>(null);
  const [error, setError] = useState<string | null>(null);
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
          viewport.current?.setRenderQuality("high");
          viewport.current?.setEnvironmentLighting("studio");
          viewport.current?.renderScene(scene);
        }}
        onMeshStatus={(detail) => setError(detail.state === "error" ? detail.message || "Model could not load" : null)}
      />
      {error && <p role="alert" className="absolute bottom-4 left-4 right-4 rounded bg-red-950/90 p-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}
