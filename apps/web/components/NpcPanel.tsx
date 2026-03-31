"use client";

import { useCallback, useEffect, useState } from "react";

import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import type { AiNpcProvider, NpcResponse } from "@/lib/aiNpcProvider";

type NpcPanelProps = {
  provider: AiNpcProvider;
  onProviderError: (message: string) => void;
};

export default function NpcPanel({ provider, onProviderError }: NpcPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [utterance, setUtterance] = useState("");
  const [responses, setResponses] = useState<NpcResponse[]>([]);

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

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-6">
      <h2 className="text-lg font-semibold text-white">NPC Panel</h2>
      <p className="mt-1 text-sm text-white/65">Session-aware NPC assistant panel for bridge workflows.</p>

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
            {responses.length === 0 ? (
              <p className="text-sm text-white/65">No NPC responses yet.</p>
            ) : (
              responses.map((response) => (
                <div key={response.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sm text-white/90">
                  {response.text}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
