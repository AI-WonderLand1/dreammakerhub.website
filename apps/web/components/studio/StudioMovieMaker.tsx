"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Clapperboard, Music, Video, Scissors, Cpu, Maximize2, Loader2 } from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

const CAST = ["Hero_Character_Model", "Monster_Asset_Rig", "Cinematic_Camera_Alpha", "Keylight_Spot_01"];

type TrackClip = {
  id: string;
  label: string;
  start: number;
  duration: number;
  shot?: "orbit" | "static";
};

const TOTAL_DURATION = 12;

export default function StudioMovieMaker() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId")?.trim() || "default";

  const viewportRef = useRef<StudioViewportHandle>(null);
  const [playback, setPlayback] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [choreography, setChoreography] = useState("");
  const [injecting, setInjecting] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [clips, setClips] = useState<{ camera: TrackClip[]; actor: TrackClip[]; audio: TrackClip[] }>({
    camera: [
      { id: "c1", label: "Cam_01_Orbit_Shot", start: 0, duration: 6, shot: "orbit" },
      { id: "c2", label: "Cam_02_Static_Close", start: 6, duration: 6, shot: "static" },
    ],
    actor: [{ id: "a1", label: "AI Gen Clip: Running_Sprint", start: 2, duration: 5 }],
    audio: [{ id: "s1", label: "ambient_wind_loop.wav", start: 0, duration: 12 }],
  });

  // Render a real set on mount so playback animates actual geometry
  useEffect(() => {
    const setScene: GeneratedScene = {
      name: "Cinema Stage Set",
      description: "Procedural cinematic stage for AI choreography",
      objects: [
        { id: "st1", name: "Hero_Character_Model", type: "box", meshUrl: "", position: [0, 0.8, 0], rotation: [0, 0, 0], scale: [0.9, 1.6, 0.9], material: "mat-hero" },
        { id: "st2", name: "Monster_Asset_Rig", type: "cone", meshUrl: "", position: [3.5, 1, -2], rotation: [0, 30, 0], scale: [1.4, 2.4, 1.4], material: "mat-monster" },
        { id: "st3", name: "Cinematic_Camera_Alpha", type: "sphere", meshUrl: "", position: [-4, 0.6, 2], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5], material: "mat-cam" },
        { id: "st4", name: "Keylight_Spot_01", type: "cylinder", meshUrl: "", position: [0, 4, -5], rotation: [0, 0, 0], scale: [1.2, 2, 1.2], material: "mat-key" },
      ],
      materials: [
        { id: "mat-hero", color: [0.2, 0.6, 1], metalness: 0.2, roughness: 0.4, emissive: [0.05, 0.15, 0.3] },
        { id: "mat-monster", color: [1, 0.3, 0.3], metalness: 0.1, roughness: 0.7 },
        { id: "mat-cam", color: [0.4, 0.4, 0.45], metalness: 0.6, roughness: 0.3 },
        { id: "mat-key", color: [1, 0.9, 0.6], metalness: 0, roughness: 0.9, emissive: [0.8, 0.7, 0.3] },
      ],
      lights: [
        { id: "light-key", type: "directional", color: [1, 1, 1], intensity: 1.3, direction: [-1, -1, -0.3] },
        { id: "light-rim", type: "point", color: [0.3, 0.6, 0.9], intensity: 1.8, position: [4, 6, -4] },
      ],
      camera: { position: [0, 4, 9], target: [0, 1, 0], fov: 55 },
      sky: { type: "color", color: [0.05, 0.06, 0.12] },
    };
    viewportRef.current?.renderScene(setScene);
  }, []);

  // Drive camera animation from the timeline clock — real playback
  useEffect(() => {
    if (!playback) {
      viewportRef.current?.animateCameraPath({ enabled: false });
      return;
    }

    const start = Date.now();
    const offset = currentTime;
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const t = offset + elapsed;
      if (t >= TOTAL_DURATION) {
        viewportRef.current?.animateCameraPath({ enabled: false });
        setPlayback(false);
        setCurrentTime(0);
        return;
      }
      setCurrentTime(t);

      // Camera track drives the shot type — orbit while in an orbit clip, stop otherwise
      const active = clips.camera.find((c) => t >= c.start && t < c.start + c.duration);
      const shot = active?.shot ?? "static";
      viewportRef.current?.animateCameraPath({
        enabled: shot === "orbit",
        speed: 0.9,
        radius: 10,
        targetY: 2,
      });
    };
    const interval = window.setInterval(tick, 50);
    return () => window.clearInterval(interval);
  }, [playback, currentTime, clips.camera]);

  const togglePlayback = useCallback(() => {
    setPlayback((prev) => !prev);
  }, []);

  const jumpTo = useCallback((t: number) => {
    setCurrentTime(t);
  }, []);

  const injectKeyframes = useCallback(async () => {
    if (!choreography.trim()) return;
    setInjecting(true);
    setSavedPath(null);
    try {
      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `cinematic choreography: ${choreography}` }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Injection failed");

      // Save the choreography keyframes (the generated scene becomes the shot) to the project
      const slug = (choreography.toLowerCase().match(/[a-z0-9]+/g) ?? ["shot"]).slice(0, 4).join("_");
      const fileName = `shots/${slug}_${Date.now().toString(36)}.json`;
      const saveRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: {
            [fileName]: JSON.stringify(
              {
                type: "shot",
                timecode: currentTime,
                duration: 4,
                choreography,
                scene: data.scene,
                keyframes: data.scene.objects.map((o: any, i: number) => ({
                  frame: Math.round((currentTime + (i % 4) * 0.5) * 24),
                  entity: o.name,
                  position: o.position,
                })),
              },
              null,
              2,
            ),
          },
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save shot");
      setSavedPath(fileName);

      const newClips: TrackClip[] = [
        ...clips.actor,
        { id: `a${Date.now()}`, label: `AI Gen Clip: ${choreography.split(" ").slice(0, 3).join(" ")}...`, start: currentTime, duration: 4 },
      ];
      if (data.scene.objects && data.scene.objects.length > 0) {
        newClips.push({ id: `c${Date.now()}`, label: `Shot: ${data.scene.name}`, start: currentTime, duration: 4, shot: "orbit" });
      }
      setClips((prev) => ({ ...prev, actor: newClips, camera: [...prev.camera, newClips[newClips.length - 1] as TrackClip] }));
    } catch (err: any) {
      logger.error("Inject keyframes error:", err);
    } finally {
      setInjecting(false);
    }
  }, [choreography, currentTime, clips, projectId]);

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Cast Explorer */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 p-3">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5">Stage Cast &amp; Props</span>
        <div className="space-y-1">
          {CAST.map((item, i) => (
            <div key={item} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/40 text-xs font-mono text-slate-300">
              <span>🎭 {item}</span>
              {i === 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">Active</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cinematic Preview */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        <div className="flex-1 relative m-4 rounded-xl border border-slate-800 overflow-hidden">
          <StudioViewport ref={viewportRef} showGizmo={false} className="h-full w-full" />
          <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur border border-slate-800 px-2 py-1 rounded-lg">
            <Clapperboard size={12} className="text-red-400" /> CAM_01_PREVIEW
          </div>
          <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-400">
            Frame {Math.floor(currentTime * 24)} @ 24fps
          </div>
          {!playback && (
            <div className="absolute bottom-3 right-3">
              <Maximize2 size={14} className="text-slate-600" />
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="h-44 bg-slate-950 border-t border-slate-800 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayback}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition"
              >
                {playback ? <Pause size={12} /> : <Play size={12} />} {playback ? "Pause" : "Play"}
              </button>
              <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-[11px] font-semibold transition">
                <Scissors size={12} /> Split Clip
              </button>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Timecode: <span className="text-cyan-300">00:{Math.floor(currentTime / 60)}:{String((currentTime % 60).toFixed(2)).padStart(5, "0")}</span> / 00:12:00
            </span>
          </div>

          <div className="flex-1 relative">
            <div className="absolute left-0 right-0 top-0 h-full grid grid-rows-3 gap-1.5">
              <TrackRow
                label="Camera Track"
                icon={<Video size={11} />}
                clips={clips.camera}
                color="border-blue-600/40 text-blue-300"
                total={TOTAL_DURATION}
                onClipClick={jumpTo}
              />
              <TrackRow
                label="Actor Animation"
                icon={<Clapperboard size={11} />}
                clips={clips.actor}
                color="border-cyan-600/40 text-cyan-300"
                total={TOTAL_DURATION}
                onClipClick={jumpTo}
              />
              <TrackRow
                label="Audio Master"
                icon={<Music size={11} />}
                clips={clips.audio}
                color="border-emerald-600/40 text-emerald-300"
                total={TOTAL_DURATION}
                onClipClick={jumpTo}
              />
            </div>
            {/* Playhead — drives the real camera animation */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10"
              style={{ left: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Choreography Panel */}
      <div className="w-72 border-l border-slate-800 bg-slate-950 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block flex items-center gap-1">
          <Cpu size={11} /> AI Choreography Engine
        </span>
        <textarea
          value={choreography}
          onChange={(e) => setChoreography(e.target.value)}
          rows={4}
          placeholder="Animate actors using natural language directives. e.g. 'hero sprints across the plaza then strikes a heroic pose at the fountain'..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-700 placeholder-slate-500 resize-none"
        />
        <button
          onClick={injectKeyframes}
          disabled={injecting || !choreography.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition"
        >
          {injecting ? <Loader2 size={14} className="animate-spin" /> : <Clapperboard size={14} />}
          {injecting ? "Injecting..." : "Inject Animation Keyframes"}
        </button>

        {savedPath && <p className="text-[10px] font-mono text-emerald-400 break-all">✓ shot saved {savedPath}</p>}

        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5">Track Summary</span>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400"><span>🎥 Camera</span><span className="text-slate-200">{clips.camera.length} clips</span></div>
            <div className="flex justify-between text-slate-400"><span>🎭 Actors</span><span className="text-slate-200">{clips.actor.length} clips</span></div>
            <div className="flex justify-between text-slate-400"><span>🎵 Audio</span><span className="text-slate-200">{clips.audio.length} clips</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackRow({
  label,
  icon,
  clips,
  color,
  total,
  onClipClick,
}: {
  label: string;
  icon: React.ReactNode;
  clips: TrackClip[];
  color: string;
  total: number;
  onClipClick?: (t: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-800/60 px-2 py-1 overflow-hidden">
      <span className={`text-[10px] font-bold uppercase whitespace-nowrap flex items-center gap-1 ${color}`}>
        {icon} {label}
      </span>
      <div className="flex-1 relative h-full">
        {clips.map((c) => (
          <button
            key={c.id}
            onClick={() => onClipClick?.(c.start)}
            className={`absolute top-1/2 -translate-y-1/2 rounded-md border ${color} bg-slate-900/70 px-2 py-1 text-[10px] font-mono whitespace-nowrap overflow-hidden text-left hover:bg-slate-800 cursor-pointer transition`}
            style={{ left: `${(c.start / total) * 100}%`, width: `${Math.max(8, (c.duration / total) * 100)}%` }}
            title={`${c.label} — click to seek to ${c.start.toFixed(1)}s`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
