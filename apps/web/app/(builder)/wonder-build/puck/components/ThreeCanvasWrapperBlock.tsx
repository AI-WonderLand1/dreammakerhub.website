"use client";

export type ThreeCanvasWrapperBlockProps = {
  label: string;
  height: "sm" | "md" | "lg" | "xl";
  sceneType: "webgl" | "3d-world" | "particle" | "custom";
  showControls: boolean;
};

const heights = {
  sm: "h-48",
  md: "h-72",
  lg: "h-96",
  xl: "h-[32rem]",
};

const sceneIcons = {
  webgl: "⬡",
  "3d-world": "🌐",
  particle: "✦",
  custom: "⚙",
};

const sceneLabels = {
  webgl: "WebGL Scene",
  "3d-world": "3D World",
  particle: "Particle System",
  custom: "Custom Scene",
};

export default function ThreeCanvasWrapperBlock({
  label = "3D Canvas",
  height = "md",
  sceneType = "webgl",
  showControls = true,
}: ThreeCanvasWrapperBlockProps) {
  return (
    <div className="p-4" data-block="three-canvas-wrapper">
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-400">{label}</p>
      )}
      <div
        className={`relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black ${heights[height]}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="text-5xl text-cyan-400/60">{sceneIcons[sceneType]}</span>
          <p className="text-sm font-semibold text-white/60">{sceneLabels[sceneType]}</p>
          <p className="text-xs text-white/30">WebGL / Three.js canvas renders here</p>

          {showControls && (
            <div className="mt-2 flex items-center gap-2">
              {["Orbit", "Zoom", "Pan"].map((ctrl) => (
                <span
                  key={ctrl}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/40"
                >
                  {ctrl}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-black/60 px-3 py-1 text-[10px] text-cyan-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {sceneLabels[sceneType]} Ready
        </div>

        <div className="absolute left-0 right-0 top-0 grid grid-cols-[repeat(12,1fr)] gap-px opacity-10">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="h-8 border-b border-r border-cyan-400/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
