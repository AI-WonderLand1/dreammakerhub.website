"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import type { AiNpcProvider, NpcResponse } from "@/lib/aiNpcProvider";
import { logger } from '@/lib/logger';

type NpcPanelProps = {
  provider: AiNpcProvider;
  onProviderError: (message: string) => void;
};

export default function NpcPanel({ provider, onProviderError }: NpcPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [utterance, setUtterance] = useState("");
  const [responses, setResponses] = useState<NpcResponse[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!provider.isConfigured) {
      return;
    }

    let mounted = true;
    setIsInitializing(true);

    provider
      .createSession()
      .then((session) => {
        if (!mounted) {
          return;
        }

        setSessionId(session.sessionId);
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to initialize NPC session.";
        onProviderError(message);
      })
      .finally(() => {
        if (mounted) {
          setIsInitializing(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [onProviderError, provider]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    return provider.subscribeNpcResponses(sessionId, (response) => {
      setResponses((prev) => [...prev, response]);
    });
  }, [provider, sessionId]);

  const sendUtterance = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      await provider.sendUserUtterance(sessionId, utterance);
      setUtterance("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send NPC utterance.";
      onProviderError(message);
    }
  }, [onProviderError, provider, sessionId, utterance]);

  const playTTS = useCallback(async (text: string, responseId: string) => {
    if (!text) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setPlayingId(responseId);
      const res = await fetch("/api/npc/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, apiKey: elevenlabsKey }),
      });

      if (!res.ok) {
        const err = await res.json();
        onProviderError(err.error || "TTS failed");
        setPlayingId(null);
        return;
      }

      const data = await res.json();
      const audio = new Audio(data.audio);
      audioRef.current = audio;
      
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setPlayingId(null);
        onProviderError("Audio playback failed");
      };
      
      await audio.play();
    } catch (error) {
      setPlayingId(null);
      onProviderError("Failed to generate speech");
    }
  }, [elevenlabsKey, onProviderError]);

  const saveElevenlabsKey = useCallback(async () => {
    if (!elevenlabsKey.trim()) return;
    try {
      await fetch("/api/npc/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store", key: elevenlabsKey }),
      });
      setShowKeyInput(false);
      setElevenlabsKey("");
    } catch (e) {
      onProviderError("Failed to save API key");
    }
  }, [elevenlabsKey, onProviderError]);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-white">NPC Panel</h2>
      <p className="mt-1 text-sm text-white/65">AI-powered NPC with OpenCode/Gemini and optional ElevenLabs TTS.</p>

      {!provider.isConfigured ? (
        <div className="mt-4">
          <EmptyState
            title="NPC provider not configured"
            description="Enable NEXT_PUBLIC_ENABLE_CONVAI_NPC and add Convai keys to show NPC responses in this bridge."
          />
        </div>
      ) : isInitializing ? (
        <div className="mt-4">
          <SkeletonGrid cards={1} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/85">
            Session active: <span className="font-mono text-xs text-white/70">{sessionId ?? "pending"}</span>
          </div>

          <div className="flex gap-2">
            <input
              value={utterance}
              onChange={(event) => setUtterance(event.target.value)}
              placeholder="Ask the NPC (placeholder)"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => {
                void sendUtterance();
              }}
              className="rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              Send
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/65">NPC responses</p>
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-xs text-white/50 hover:text-white/80"
              >
                {showKeyInput ? "Hide" : "Set"} ElevenLabs Key
              </button>
            </div>
            
            {showKeyInput && (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={elevenlabsKey}
                  onChange={(e) => setElevenlabsKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={saveElevenlabsKey}
                  className="rounded-lg bg-green-600/50 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600/70"
                >
                  Save
                </button>
              </div>
            )}

            {responses.length === 0 ? (
              <p className="text-sm text-white/65">No NPC responses yet.</p>
            ) : (
              responses.map((response) => (
                <div key={response.id} className="group flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
                  <span className="flex-1 text-sm text-white/90">{response.text}</span>
                  <button
                    type="button"
                    onClick={() => playTTS(response.text, response.id)}
                    disabled={playingId === response.id}
                    className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    title="Play with ElevenLabs TTS"
                  >
                    {playingId === response.id ? (
                      <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
