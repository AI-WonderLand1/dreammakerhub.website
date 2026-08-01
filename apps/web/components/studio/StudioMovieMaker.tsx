"use client";

import { useCallback, useState } from "react";
import { Play, Pause, Film, Clapperboard, Music, Video, Scissors, Cpu, Maximize2 } from "lucide-react";
import { logger } from "@/lib/logger";

const CAST = ["Hero_Character_Model", "Monster_Asset_Rig", "Cinematic_Camera_Alpha", "Keylight_Spot_01"];

type TrackClip = {
  id: string;
  label: string;
  start: number;
  duration: number;
};

export default function StudioMovieMaker() {
  const [playback, setPlayback] = useState(false);
  const [currentTime, setCurrentTime] = useState(4.18);
  const [choreography, setChoreography] = useState("");
  const [injecting, setInjecting] = useState(false);
  const [clips, setClips] = useState<{ camera: TrackClip[]; actor: TrackClip[]; audio: TrackClip[] }>({
    camera: [
      { id: "c1", label: "Cam_01_Orbit_Shot", start: 0, duration: 6 },
      { id: "c2", label: "Cam_02_Static_Close", start: 6, duration: 6 },
    ],
    actor: [{ id: "a1", label: "AI Gen Clip: Running_Sprint", start: 2, duration: 5 }],
    audio: [{ id: "s1", label: "ambient_wind_loop.wav", start: 0, duration: 12 }],
  });

  const togglePlayback = useCallback(() => {
    setPlayback((prev) => {
      if (!prev) {
        const interval = window.setInterval(() => {
          setCurrentTime((t) => {
            if (t >= 12) {
              window.clearInterval(interval);
              setPlayback(false);
              return 0;
            }
            return t + 0.1;
          });
        }, 100);
        (window as any).__studioMovieInterval = interval;
      } else {
        window.clearInterval((window as any).__studioMovieInterval);
      }
      return !prev;
    });
  }, []);

  const injectKeyframes = useCallback(async () => {
    if (!choreography.trim()) return;
    setInjecting(true);
    try {
      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `cinematic choreography: ${choreography}` }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Injection failed");
      setClips((prev) => ({
        ...prev,
        actor: [
          ...prev.actor,
          { id: `a${Date.now()}`, label: `AI Gen Clip: ${choreography.split(" ").slice(0, 3).join(" ")}...`, start: currentTime, duration: 4 },
        ],
      }));
    } catch (err: any) {
      logger.error("Inject keyframes error:", err);
    } finally {
      setInjecting(false);
    }
  }, [choreography, currentTime]);

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
        <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,#1e293b,#020617)] m-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur border border-slate-800 px-2 py-1 rounded-lg">
            <Clapperboard size={12} className="text-red-400" /> CAM_01_PREVIEW
          </div>
          <div className="flex flex-col items-center text-slate-500">
            <Film size={48} className="stroke-1 mb-3 text-slate-700" />
            <span className="text-xs font-mono">Cinematic Master Render Node Viewport</span>
            <span className="mt-1 text-[10px] font-mono text-slate-600">Frame {Math.floor(currentTime * 24)} @ 24fps</span>
          </div>
          <div className="absolute bottom-3 right-3">
            <Maximize2 size={14} className="text-slate-600" />
          </div>
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
                total={12}
              />
              <TrackRow
                label="Actor Animation"
                icon={<Clapperboard size={11} />}
                clips={clips.actor}
                color="border-cyan-600/40 text-cyan-300"
                total={12}
              />
              <TrackRow
                label="Audio Master"
                icon={<Music size={11} />}
                clips={clips.audio}
                color="border-emerald-600/40 text-emerald-300"
                total={12}
              />
            </div>
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10"
              style={{ left: `${(currentTime / 12) * 100}%` }}
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
          <Clapperboard size={14} /> {injecting ? "Injecting..." : "Inject Animation Keyframes"}
        </button>

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
}: {
  label: string;
  icon: React.ReactNode;
  clips: TrackClip[];
  color: string;
  total: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-800/60 px-2 py-1 overflow-hidden">
      <span className={`text-[10px] font-bold uppercase whitespace-nowrap flex items-center gap-1 ${color}`}>
        {icon} {label}
      </span>
      <div className="flex-1 relative h-full">
        {clips.map((c) => (
          <div
            key={c.id}
            className={`absolute top-1/2 -translate-y-1/2 rounded-md border ${color} bg-slate-900/70 px-2 py-1 text-[10px] font-mono whitespace-nowrap overflow-hidden`}
            style={{ left: `${(c.start / total) * 100}%`, width: `${Math.max(8, (c.duration / total) * 100)}%` }}
            title={c.label}
          >
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
