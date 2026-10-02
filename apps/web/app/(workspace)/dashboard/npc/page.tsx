"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Trash2,
  Play,
  Circle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNpcRealtime, forwardToPlayCanvas, type NpcLiveEvent } from "@/lib/npc/realtime";

type Npc = {
  id: string;
  name: string;
  worldId?: string | null;
  modelUrl?: string | null;
  position?: number[] | null;
  rotation?: number[] | null;
  personality?: string | null;
  llmProvider?: string | null;
  llmModel?: string | null;
  systemPrompt?: string | null;
  knowledgeBase?: any[] | null;
  memorySize?: number | null;
  interactionRadius?: number | null;
  voiceEnabled?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export default function NpcPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveNpcId, setLiveNpcId] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([]);

  const { status: liveStatus } = useNpcRealtime(liveNpcId, {
    onVoice: (event) => setLiveLog((log) => [`voice chunk (${Math.round(event.audio.length / 1024)} KB)`, ...log].slice(0, 20)),
    onViseme: (event) => setLiveLog((log) => [`visemes: jaw=${event.visemes.jawOpen.toFixed(2)}`, ...log].slice(0, 20)),
    onDialogue: (event) => setLiveLog((log) => [`dialogue: ${event.dialogue.text}`, ...log].slice(0, 20)),
    onMessage: (data) => setLiveLog((log) => [`msg: ${JSON.stringify(data)}`, ...log].slice(0, 20)),
    onError: (message) => setLiveLog((log) => [`error: ${message}`, ...log].slice(0, 20)),
  });

  const deployToPlayCanvas = (npcId: string) => {
    const url = `/dashboard/editor-playcanvas?sceneId=npc-${npcId}&projectId=default`;
    const win = window.open(url, "_blank");
    if (win) {
      const evt: NpcLiveEvent = {
        type: "meta",
        data: { npcId, userId: "dashboard", engineUrl: window.location.origin },
      };
      window.setTimeout(() => forwardToPlayCanvas(evt, win), 1500);
    }
  };

  const loadNpcs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/npc", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 403) {
        router.replace("/public-pages/auth?redirectTo=%2Fdashboard%2Fnpc");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false || !Array.isArray(data?.npcs)) {
        throw new Error(data?.message || "Failed to load NPCs");
      }
      setNpcs(data.npcs);
    } catch (err) {
      console.error("Error loading NPCs:", err);
      setError(err instanceof Error ? err.message : "Failed to load NPCs");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadNpcs();
  }, [loadNpcs]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this NPC?")) return;

    try {
      const response = await fetch(`/api/npc?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        router.replace("/public-pages/auth?redirectTo=%2Fdashboard%2Fnpc");
        return;
      }
      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message || "Failed to delete NPC");
      }
      setNpcs((currentNpcs) => currentNpcs.filter((npc) => npc.id !== id));
    } catch (err) {
      console.error("Error deleting NPC:", err);
      setError(err instanceof Error ? err.message : "Failed to delete NPC");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My NPCs</h1>
          <Link href="/dashboard/npc/create" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium">
            <Play size={20} /> Create NPC
          </Link>
        </div>
        <div className="animate-pulse text-white/50">Loading your NPCs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My NPCs</h1>
          <Link href="/dashboard/npc/create" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium">
            <Play size={20} /> Create NPC
          </Link>
        </div>
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My NPCs</h1>
        <Link href="/dashboard/npc/create" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium">
          <Play size={20} /> Create NPC
        </Link>
      </div>
      
      {npcs.length === 0 ? (
        <div className="text-center py-12">
          <Circle size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-4">You haven't created any NPCs yet</p>
          <Link href="/dashboard/npc/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white">
            <Play size={16} /> Create Your First NPC
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {npcs.map((npc) => (
            <div key={npc.id} className="border border-white/10 rounded-xl overflow-hidden hover:bg-white/5 transition">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border-l-2 border-l-cyan-400">
                    <Play size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium">{npc.name}</div>
                    <div className="text-xs text-white/50">
                      {npc.llmProvider || 'Unknown'} • 
                      {npc.voiceEnabled ? 'Voice Enabled' : 'Text Only'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setLiveNpcId(liveNpcId === npc.id ? null : npc.id); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      liveNpcId === npc.id
                        ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                        : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${liveNpcId === npc.id ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
                    {liveNpcId === npc.id ? "Live" : "Go Live"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(npc.id); }}
                    className="p-2 rounded hover:bg-white/10 text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {liveNpcId === npc.id && (
                <div className="border-t border-white/10 bg-black/30 px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-white/50">Real-time connection: </span>
                      <span className={`font-semibold ${
                        liveStatus === "connected" ? "text-emerald-400" :
                        liveStatus === "connecting" ? "text-yellow-400" :
                        liveStatus === "error" ? "text-red-400" : "text-white/60"
                      }`}>
                        {liveStatus}
                      </span>
                    </div>
                    <button
                      onClick={() => deployToPlayCanvas(npc.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition"
                    >
                      <Play size={12} /> Deploy to PlayCanvas
                    </button>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2 font-mono text-[11px] text-white/60 max-h-40 overflow-auto custom-scrollbar">
                    {liveLog.length === 0 ? (
                      <span className="text-white/35">No live events yet. Deploy to PlayCanvas to stream voice, visemes & dialogue.</span>
                    ) : (
                      liveLog.map((line, i) => <div key={i}>{line}</div>)
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}