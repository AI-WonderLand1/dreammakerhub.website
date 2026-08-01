"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, MapPin, Sun, Aperture, Layers } from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";

const ENVIRONMENTS = [
  { id: "cyberpunk", name: "Cyberpunk_Alley", base: [0.5, 0.15, 0.4] as [number, number, number] },
  { id: "studio", name: "Studio_Neon_Rig", base: [0.2, 0.2, 0.5] as [number, number, number] },
  { id: "loft", name: "Minimalist_Loft", base: [0.55, 0.42, 0.3] as [number, number, number] },
  { id: "desert", name: "Desert_Sunset", base: [0.8, 0.5, 0.25] as [number, number, number] },
];

const TONE_MAPPING = ["ACES Filmic", "Linear Exposure", "Reinhard"];

export default function Studio360View() {
  const viewportRef = useRef<StudioViewportHandle>(null);
  const [selectedEnv, setSelectedEnv] = useState(ENVIRONMENTS[0]);
  const [exposure, setExposure] = useState(1.2);
  const [fov, setFov] = useState(90);
  const [tone, setTone] = useState(TONE_MAPPING[0]);
  const [hotspots, setHotspots] = useState<{ id: string; label: string }[]>([
    { id: "h1", label: "Entrance" },
    { id: "h2", label: "Main Light" },
  ]);

  useEffect(() => {
    viewportRef.current?.renderPanorama({
      exposure,
      fov,
      baseColor: selectedEnv.base,
    });
  }, [selectedEnv, exposure, fov]);

  const addHotspot = useCallback(() => {
    setHotspots((prev) => [...prev, { id: `h${Date.now()}`, label: `Hotspot ${prev.length + 1}` }]);
  }, []);

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Environments file system */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 p-3">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5">Panoramic Backdrops</span>
        <div className="space-y-1">
          {ENVIRONMENTS.map((env) => (
            <div
              key={env.id}
              onClick={() => setSelectedEnv(env)}
              className={`p-2 rounded-lg border text-xs font-mono cursor-pointer transition ${
                selectedEnv.id === env.id
                  ? "bg-slate-900 border-slate-700 text-cyan-400"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50"
              }`}
            >
              🗺️ {env.name}.exr
            </div>
          ))}
        </div>

        <div className="mt-6">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
            <MapPin size={11} /> Hotspots
          </span>
          <div className="space-y-1">
            {hotspots.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1.5"><MapPin size={11} className="text-amber-400" /> {h.label}</span>
                <button
                  onClick={() => setHotspots((prev) => prev.filter((x) => x.id !== h.id))}
                  className="text-slate-600 hover:text-red-400 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addHotspot}
            className="mt-2 w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-[11px] font-semibold transition"
          >
            + Add Hotspot
          </button>
        </div>
      </div>

      {/* Main spherical viewport */}
      <div className="flex-1 relative bg-slate-900 min-w-0">
        <StudioViewport ref={viewportRef} showGizmo={false} className="h-full w-full" />
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 p-2 rounded-lg text-[10px] font-mono text-slate-400">
          <Eye size={11} className="inline mr-1 text-cyan-400" /> EQUIRECTANGULAR WRAP PROJECTION
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-full">
          🌐 Hold Left Click &amp; Drag to Orbit · Scroll to Zoom
        </div>
      </div>

      {/* Configuration controls */}
      <div className="w-72 border-l border-slate-800 bg-slate-950 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block flex items-center gap-1">
          <Sun size={11} /> Lighting &amp; Camera
        </span>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Exposure</span>
            <span className="font-mono text-slate-200">{exposure.toFixed(2)} lx</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.05}
            value={exposure}
            onChange={(e) => setExposure(parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Camera FOV</span>
            <span className="font-mono text-slate-200">{fov}°</span>
          </div>
          <input
            type="range"
            min={30}
            max={120}
            step={1}
            value={fov}
            onChange={(e) => setFov(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5 flex items-center gap-1">
            <Aperture size={11} /> Tone Mapping Engine
          </span>
          <div className="space-y-1">
            {TONE_MAPPING.map((mode) => (
              <button
                key={mode}
                onClick={() => setTone(mode)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-mono transition ${
                  tone === mode
                    ? "bg-cyan-950/40 border-cyan-700 text-cyan-300"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
            <Layers size={11} /> Scene Summary
          </span>
          <p className="text-xs text-slate-300 font-mono">{selectedEnv.name}.exr</p>
          <p className="text-[10px] text-slate-500 mt-1">
            Panoramic environment · {hotspots.length} active hotspots · {TONE_MAPPING.indexOf(tone) === 0 ? "Filmic" : TONE_MAPPING.indexOf(tone) === 1 ? "Linear" : "Reinhard"} tone map
          </p>
        </div>
      </div>
    </div>
  );
}
