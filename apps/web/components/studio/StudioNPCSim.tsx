"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, Bot, Mic, Sparkles, Cpu, Zap, Loader2, Save, Download, Eye, Gamepad2, Mic2, Play, Pause } from "lucide-react";
import StudioViewport, { type StudioViewportHandle } from "@/components/studio/StudioViewport";
import type { GeneratedScene, GeneratedSceneMaterial, GeneratedSceneObject } from "@/lib/scene/generateScene";
import { useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

interface NPCAsset {
  id: string;
  name: string;
  description: string;
  type: "humanoid" | "creature" | "vehicle" | "prop";
  personality: string[];
  thumbnail: string;
  tags: string[];
  previewImages: string[];
  stats: {
    health: number;
    speed: number;
    intelligence: number;
    combat: number;
  };
  aiConfig: {
    behaviorTree: string;
    perceptionRange: number;
    decisionInterval: number;
  };
}

const NPC_ASSETS: NPCAsset[] = [
  {
    id: "guardian",
    name: "Guardian Knight",
    description: "A loyal protector with tactical combat AI. Patrols areas, defends allies, and engages threats intelligently.",
    type: "humanoid",
    personality: ["Brave", "Loyal", "Tactical", "Protective"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight&backgroundColor=3b82f6,1e40af",
    tags: ["Combat", "Patrol", "Teamplay"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight-1&backgroundColor=3b82f6",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=guardian-knight-2&backgroundColor=1e40af",
    ],
    stats: { health: 100, speed: 5, intelligence: 7, combat: 9 },
    aiConfig: { behaviorTree: "GuardianPatrol", perceptionRange: 15, decisionInterval: 500 }
  },
  {
    id: "merchant",
    name: "Wandering Merchant",
    description: "An intelligent trader who evaluates player inventory, offers dynamic pricing, and remembers past transactions.",
    type: "humanoid",
    personality: ["Cunning", "Friendly", "Opportunistic", "Memorable"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant&backgroundColor=f59e0b,d97706",
    tags: ["Trading", "Economy", "Dialogue"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant-1&backgroundColor=f59e0b",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=wandering-merchant-2&backgroundColor=d97706",
    ],
    stats: { health: 50, speed: 4, intelligence: 9, combat: 2 },
    aiConfig: { behaviorTree: "MerchantTrade", perceptionRange: 10, decisionInterval: 1000 }
  },
  {
    id: "beast",
    name: "Shadow Beast",
    description: "A territorial predator with pack hunting AI. Coordinates with allies, flanks prey, and adapts to player tactics.",
    type: "creature",
    personality: ["Aggressive", "Cunning", "Territorial", "Pack-oriented"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow-beast&backgroundColor=ef4444,dc2626",
    tags: ["Combat", "Hunting", "Stealth"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow-beast-1&backgroundColor=ef4444",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=shadow-beast-2&backgroundColor=dc2626",
    ],
    stats: { health: 80, speed: 8, intelligence: 6, combat: 8 },
    aiConfig: { behaviorTree: "PredatorHunt", perceptionRange: 20, decisionInterval: 300 }
  },
  {
    id: "drone",
    name: "Scout Drone",
    description: "Autonomous aerial unit with computer vision. Surveys areas, detects threats, and relays tactical data.",
    type: "vehicle",
    personality: ["Vigilant", "Precise", "Relentless", "Efficient"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone&backgroundColor=8b5cf6,7c3aed",
    tags: ["Recon", "Vision", "Support"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone-1&backgroundColor=8b5cf6",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=scout-drone-2&backgroundColor=7c3aed",
    ],
    stats: { health: 40, speed: 12, intelligence: 8, combat: 3 },
    aiConfig: { behaviorTree: "DroneSurvey", perceptionRange: 30, decisionInterval: 200 }
  },
  {
    id: "villager",
    name: "Village Elder",
    description: "Wise NPC with dynamic dialogue system. Offers quests, shares lore, and reacts to world state changes.",
    type: "humanoid",
    personality: ["Wise", "Compassionate", "Knowledgeable", "Patient"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder&backgroundColor=22c55e,16a34a",
    tags: ["Quest", "Dialogue", "Lore"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder-1&backgroundColor=22c55e",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=village-elder-2&backgroundColor=16a34a",
    ],
    stats: { health: 60, speed: 3, intelligence: 10, combat: 1 },
    aiConfig: { behaviorTree: "ElderDialogue", perceptionRange: 8, decisionInterval: 2000 }
  },
  {
    id: "sentry",
    name: "Automated Sentry",
    description: "Stationary defense unit with threat assessment AI. Identifies targets, prioritizes threats, and coordinates with network.",
    type: "prop",
    personality: ["Vigilant", "Ruthless", "Calculating", "Networked"],
    thumbnail: "https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry&backgroundColor=6b7280,4b5563",
    tags: ["Defense", "Surveillance", "Automation"],
    previewImages: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry-1&backgroundColor=6b7280",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=automated-sentry-2&backgroundColor=4b5563",
    ],
    stats: { health: 120, speed: 0, intelligence: 7, combat: 9 },
    aiConfig: { behaviorTree: "SentryDefense", perceptionRange: 25, decisionInterval: 100 }
  }
];

const ACTOR_COLORS: Record<string, [number, number, number]> = {
  humanoid: [0.2, 0.6, 1],
  creature: [1, 0.3, 0.3],
  vehicle: [0.55, 0.35, 0.96],
  prop: [0.42, 0.45, 0.5],
};

const ACTOR_PRIMITIVE: Record<string, GeneratedSceneObject["type"]> = {
  humanoid: "box",
  creature: "cone",
  vehicle: "box",
  prop: "cylinder",
};

type ActorNode = {
  id: string;
  name: string;
  type: string;
  assetId: string;
  x: number;
  y: number;
  voiceConfig: VoiceConfig;
};

type VoiceConfig = {
  enabled: boolean;
  voiceId: string;
  provider: "elevenlabs" | "browser" | "openai" | "azure";
  language: string;
  pitch: number;
  speed: number;
  volume: number;
  tone: string;
  emotion: string;
  speakingStyle: string;
  spatialAudio: boolean;
  subtitles: boolean;
  interruptible: boolean;
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
};

const DEFAULT_VOICE: VoiceConfig = {
  enabled: true,
  voiceId: "default",
  provider: "elevenlabs",
  language: "en-US",
  pitch: 1.0,
  speed: 1.0,
  volume: 1.0,
  tone: "neutral",
  emotion: "calm",
  speakingStyle: "conversational",
  spatialAudio: true,
  subtitles: true,
  interruptible: true,
  maxDistance: 20,
  refDistance: 1,
  rolloffFactor: 1,
};

export default function StudioNPCSim() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId")?.trim() || "default";

  const viewportRef = useRef<StudioViewportHandle>(null);
  const [actors, setActors] = useState<ActorNode[]>([]);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [gridSize, setGridSize] = useState(12);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);

  useEffect(() => {
    viewportRef.current?.clearActors();
    for (const actor of actors) {
      viewportRef.current?.placeActor({ name: actor.name, type: actor.type, x: actor.x, y: actor.y });
    }
  }, [actors]);

  const getAsset = useCallback((assetId: string) => NPC_ASSETS.find(a => a.id === assetId), []);

  const addActor = useCallback((assetId: string) => {
    const asset = getAsset(assetId);
    if (!asset) return;
    const idx = actors.length + 1;
    const name = `${asset.name} ${idx}`;
    setActors((prev) => [
      ...prev,
      { 
        id: `npc-${Date.now()}`, 
        name, 
        type: asset.type, 
        assetId, 
        x: (idx * 2) % gridSize, 
        y: Math.floor((idx * 2) / gridSize) % gridSize,
        voiceConfig: { ...DEFAULT_VOICE }
      },
    ]);
    setShowAssetPanel(false);
  }, [actors.length, gridSize, getAsset]);

  const removeActor = useCallback((id: string) => {
    setActors((prev) => prev.filter((a) => a.id !== id));
    if (selectedActorId === id) setSelectedActorId(null);
  }, [selectedActorId]);

  const toggleTestPlay = useCallback(() => {
    setTesting((prev) => {
      viewportRef.current?.animateCameraPath({ enabled: !prev, speed: 1, radius: 12, targetY: 2 });
      return !prev;
    });
  }, []);

  const buildScene = useCallback((): GeneratedScene => {
    const materials: GeneratedSceneMaterial[] = actors.map((a) => {
      const color = ACTOR_COLORS[a.type] ?? [0.5, 0.5, 0.8];
      return {
        id: `mat-${a.id}`,
        color,
        metalness: a.type === "prop" ? 0.3 : 0.1,
        roughness: 0.6,
        emissive: [0, 0, 0],
      };
    });

    const objects: GeneratedSceneObject[] = actors.map((a) => {
      const worldX = (a.x / gridSize) * 20 - 10;
      const worldZ = (a.y / gridSize) * 20 - 10;
      return {
        id: a.id,
        name: a.name,
        type: ACTOR_PRIMITIVE[a.type] ?? "box",
        meshUrl: "",
        position: [worldX, a.type === "prop" ? 0.5 : 0.8, worldZ],
        rotation: [0, 0, 0],
        scale: a.type === "prop" ? [1.2, 2, 1.2] : [0.8, 0.8, 0.8],
        material: `mat-${a.id}`,
      };
    });

    return {
      name: "NPC Simulation Scene",
      description: `NPC Simulation: ${actors.map((a) => a.name).join(", ") || "empty"}`,
      objects,
      materials,
      lights: [
        { id: "light-key", type: "directional", color: [1, 1, 1], intensity: 1.2, direction: [-1, -1, -0.3] },
        { id: "light-rim", type: "point", color: [0.3, 0.6, 0.9], intensity: 1.5, position: [4, 6, -4] },
      ],
      camera: { position: [0, 5, 12], target: [0, 1, 0], fov: 60 },
      sky: { type: "color", color: [0.05, 0.08, 0.16] },
    };
  }, [actors, gridSize]);

  const compileBehavior = useCallback(async () => {
    if (!actors.length) return;
    setCompiling(true);
    setScript(null);
    setSavedPath(null);
    try {
      const scene = buildScene();

      const res = await fetch("/api/3d/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: `NPC simulation with ${actors.length} actors: ${actors.map(a => `${a.name} (${a.type})`).join(", ")}`
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || "Compile failed");

      viewportRef.current?.renderScene(data.scene);

      setSaving(true);
      const slug = "npc-sim";
      const fileName = `npc-sims/${slug}_${Date.now().toString(36)}.json`;
      const saveRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: {
            [fileName]: JSON.stringify({ 
              ...scene, 
              name: data.scene.name, 
              description: data.scene.description,
              actors: actors.map(a => ({
                ...a,
                voiceConfig: a.voiceConfig
              }))
            }, null, 2),
          },
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save simulation");
      setSavedPath(fileName);

      setScript(
        `// NPC Simulation "${data.scene.name}" → saved to ${fileName}\n\n${actors
          .map((a) => `spawnNPC("${a.name}", { 
  type: "${a.type}", 
  personality: ${JSON.stringify(getAsset(a.assetId)?.personality || [])},
  voice: ${JSON.stringify(a.voiceConfig)},
  at: [${((a.x / gridSize) * 20 - 10).toFixed(2)}, ${((a.y / gridSize) * 20 - 10).toFixed(2)}]
});`)
          .join("\n\n")}\n\n// Behavior trees loaded from assets\n${actors.map(a => `// ${a.name}: ${getAsset(a.assetId)?.aiConfig.behaviorTree || "custom"}`).join("\n")}`,
      );
    } catch (err: any) {
      logger.error("Compile NPC sim error:", err);
      setScript(`// Compilation failed: ${err?.message ?? "unknown error"}`);
    } finally {
      setCompiling(false);
      setSaving(false);
    }
  }, [actors, buildScene, projectId, gridSize]);

  const selectedActor = actors.find(a => a.id === selectedActorId);
  const selectedAsset = selectedActor ? getAsset(selectedActor.assetId) : null;

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Spawnable Actor Directory */}
      <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1">
            <Users size={11} /> NPC Templates
          </span>
          <button
            onClick={() => setShowAssetPanel(!showAssetPanel)}
            className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
              showAssetPanel ? "bg-purple-600/20 text-purple-300" : "text-white/40 hover:text-white"
            }`}
          >
            {showAssetPanel ? "Hide" : "Show"} Assets
          </button>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            placeholder="Search NPCs..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-700 placeholder-slate-500"
          />
          <span className="absolute left-2.5 top-1.5 text-slate-500 text-[11px]">
            <span className="lucide lucide-search" />
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {NPC_ASSETS.filter(a => 
            a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
            a.type.toLowerCase().includes(assetSearch.toLowerCase()) ||
            a.tags.some(t => t.toLowerCase().includes(assetSearch.toLowerCase()))
          ).map((asset) => (
            <button
              key={asset.id}
              onClick={() => addActor(asset.id)}
              className="w-full text-left p-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900 text-xs font-mono text-slate-300 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{asset.thumbnail.startsWith('http') ? '' : asset.thumbnail}</span>
                <img src={asset.thumbnail} alt="" className="w-6 h-6 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{asset.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{asset.type}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Viewport Editor */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0 pb-14">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Gamepad2 size={13} className="text-cyan-400" /> NPC Simulation ({gridSize}×{gridSize} units)
          </span>
          <div className="flex items-center gap-2">
            <select
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
            >
              {[8, 12, 16].map((n) => <option key={n} value={n}>{n}×{n}</option>)}
            </select>
            <button
              onClick={toggleTestPlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition ${
                testing ? "bg-red-900/50 text-red-300 hover:bg-red-900" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              {testing ? <><Pause size={12} /> Stop</> : <><Play size={12} /> Test Play</>}
            </button>
          </div>
        </div>

        <StudioViewport ref={viewportRef} className="flex-1" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[11px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-full">
          {testing ? "🎮 TEST PLAY — orbit camera flying over level" : "🎮 Add NPCs → they spawn as real 3D entities with AI behaviors"}
        </div>
      </div>

      {/* Right Panel - Inspector / Voice Config / AI Behavior */}
      <div className="w-80 border-l border-slate-800 bg-slate-950 p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
        {selectedActor ? (
          <>
            {/* Actor Inspector */}
            <div>
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
                <Bot size={11} /> {selectedActor.name}
              </span>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <img src={selectedAsset?.thumbnail || ""} alt="" className="w-10 h-10 rounded" />
                  <div>
                    <h4 className="text-white font-medium">{selectedActor.name}</h4>
                    <p className="text-xs text-slate-400 capitalize">{selectedAsset?.type || selectedActor.type}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Position</label>
                  <div className="grid grid-cols-3 gap-1">
                    {["X", "Y", "Z"].map((axis) => (
                      <input
                        key={axis}
                        type="number"
                        step="0.1"
                        value={axis === "X" ? selectedActor.x : axis === "Y" ? selectedActor.y : 0}
                        onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, [axis.toLowerCase()]: parseFloat(e.target.value) } : a))}
                        className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                        placeholder="0"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Stats</label>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    {selectedAsset && Object.entries(selectedAsset.stats).map(([key, val]) => (
                      <div key={key} className="bg-slate-900/60 p-1.5 rounded text-center">
                        <div className="text-white font-mono">{val}</div>
                        <div className="text-slate-500 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Personality</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedAsset?.personality.map((trait) => (
                      <span key={trait} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">{trait}</span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowVoiceConfig(!showVoiceConfig)}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-200 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <Mic2 size={12} className={selectedActor.voiceConfig.enabled ? "text-emerald-400" : "text-slate-500"} />
                      NPC Voice Config
                    </span>
                    <span className={showVoiceConfig ? "text-emerald-400" : "text-slate-500"}>
                      {showVoiceConfig ? "▲" : "▼"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Configuration Panel */}
            {showVoiceConfig && (
              <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/30 p-3 space-y-3 animate-slide-down">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                      checked={selectedActor.voiceConfig.enabled}
                      onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, voiceConfig: { ...a.voiceConfig, enabled: e.target.checked } } : a))}
                    />
                    <span className="text-sm text-slate-200">Enabled</span>
                  </label>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Voice ID</label>
                    <select
                      value={selectedActor.voiceConfig.voiceId}
                      onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, voiceConfig: { ...a.voiceConfig, voiceId: e.target.value } } : a))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="default">Default</option>
                      <option value="rachel">Rachel (ElevenLabs)</option>
                      <option value="domi">Domi (ElevenLabs)</option>
                      <option value="bella">Bella (ElevenLabs)</option>
                      <option value="antoni">Antoni (ElevenLabs)</option>
                      <option value="elli">Elli (ElevenLabs)</option>
                      <option value="josh">Josh (ElevenLabs)</option>
                      <option value="arnold">Arnold (ElevenLabs)</option>
                      <option value="adam">Adam (ElevenLabs)</option>
                      <option value="sam">Sam (ElevenLabs)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Provider</label>
                    <select
                      value={selectedActor.voiceConfig.provider}
                      onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, voiceConfig: { ...a.voiceConfig, provider: e.target.value as any } } : a))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="browser">Browser TTS</option>
                      <option value="openai">OpenAI TTS</option>
                      <option value="azure">Azure Speech</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Language</label>
                    <select
                      value={selectedActor.voiceConfig.language}
                      onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, voiceConfig: { ...a.voiceConfig, language: e.target.value } } : a))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-ES">Spanish</option>
                      <option value="fr-FR">French</option>
                      <option value="de-DE">German</option>
                      <option value="ja-JP">Japanese</option>
                      <option value="ko-KR">Korean</option>
                      <option value="zh-CN">Chinese</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Tone</label>
                    <select
                      value={selectedActor.voiceConfig.tone}
                      onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, voiceConfig: { ...a.voiceConfig, tone: e.target.value } } : a))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="royal">Royal</option>
                      <option value="friendly">Friendly</option>
                      <option value="serious">Serious</option>
                      <option value="playful">Playful</option>
                      <option value="ominous">Ominous</option>
                      <option value="whisper">Whisper</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Emotion</label>
                    <select
                      value={selectedActor.voiceConfig.emotion}
                      onChange={(e) => setActors(prev => prev.map(a => a.id === selectedActorId ? { ...a, voiceConfig: { ...a.voiceConfig, emotion: e.target.value } } : a))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="calm">Calm</option>
                      <option value="happy">Happy</option>
                      <option value="angry">Angry</option>
                      <option value="sad">Sad</option>
                      <option value="fearful">Fearful</option>
                      <option value="surprised">Surprised</option>
                      <option value="excited">Excited</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-cyan-800/30">
                    <button
                      onClick={() => {
                        console.log('[Voice] Test Voice:', { voiceConfig: selectedActor.voiceConfig, name: selectedActor.name });
                        alert(`Test Voice for ${selectedActor.name}:\nProvider: ${selectedActor.voiceConfig.provider}\nVoice: ${selectedActor.voiceConfig.voiceId}\nTone: ${selectedActor.voiceConfig.tone}\nEmotion: ${selectedActor.voiceConfig.emotion}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold transition"
                    >
                      <Mic size={12} /> Test Voice
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Behavior Config */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
                <Cpu size={11} /> AI Behavior
              </span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" defaultChecked />
                  <span className="text-sm text-slate-300">Enable AI Reasoning</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" defaultChecked />
                  <span className="text-sm text-slate-300">Visual Perception</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" />
                  <span className="text-sm text-slate-300">Audio Perception</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500" defaultChecked />
                  <span className="text-sm text-slate-300">Behavior Tree</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">Behavior Tree</span>
                <div className="bg-slate-900/60 border border-slate-800 rounded p-2 text-[10px] font-mono text-cyan-300">
                  {selectedAsset?.aiConfig.behaviorTree || "custom"}
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                  <div className="bg-slate-900/60 p-1.5 rounded text-center">
                    <div className="text-white font-mono">{selectedAsset?.aiConfig.perceptionRange || 0}</div>
                    <div className="text-slate-500">Perception</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded text-center">
                    <div className="text-white font-mono">{selectedAsset?.aiConfig.decisionInterval || 0}ms</div>
                    <div className="text-slate-500">Decision</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded text-center">
                    <div className="text-white font-mono">Active</div>
                    <div className="text-slate-500">Status</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-sm">Select an NPC to configure</p>
            <p className="text-xs text-slate-600 mt-1">Click on any NPC in the viewport</p>
          </div>
        )}

        {/* Compile Panel */}
        <div className="pt-4 border-t border-slate-800">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2.5 flex items-center gap-1">
            <Zap size={11} /> Build & Compile
          </span>
          <button
            onClick={compileBehavior}
            disabled={compiling || !actors.length}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition"
          >
            {compiling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {compiling ? (saving ? "Saving..." : "Compiling...") : "Compile NPC Simulation"}
          </button>

          {savedPath && <p className="text-[10px] font-mono text-emerald-400 break-all mt-2">✓ saved {savedPath}</p>}

          {script && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-[#0d1117] p-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Compiled Output</span>
              <pre className="text-[10px] leading-relaxed text-emerald-300/80 font-mono whitespace-pre-wrap">{script}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}