'use client';

import { useState, useCallback } from "react";
import { Sparkles, Send, X, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { sendToAIBuilder, PuckData } from "@/lib/ai/puckBuilder";

interface PuckAIPanelProps {
  currentData: PuckData | null;
  onApplyData: (data: PuckData) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PuckAIPanel({ 
  currentData, 
  onApplyData, 
  isOpen, 
  onClose 
}: PuckAIPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  const handleBuild = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const result = await sendToAIBuilder(prompt, currentData || undefined);
      setResponse(result.response);
      
      if (result.puckData.content.length > 0) {
        onApplyData(result.puckData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [prompt, currentData, onApplyData]);

  const handleModify = useCallback(async () => {
    if (!prompt.trim() || !currentData) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const result = await sendToAIBuilder(
        `Modify the current page: ${prompt}`,
        currentData
      );
      setResponse(result.response);
      
      if (result.puckData.content.length > 0) {
        onApplyData(result.puckData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [prompt, currentData, onApplyData]);

  const handleClear = useCallback(() => {
    setPrompt("");
    setResponse("");
    setError("");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[500px] bg-[#0a0a10]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-white">AI Builder</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[350px]">
        {currentData && currentData.content.length > 0 && (
          <div className="text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2">
            Current: {currentData.content.map(c => c.type).join(", ")}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-white/60">Describe what you want to build or modify:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={currentData ? "Modify the current page..." : "Build a landing page with hero, features, and pricing..."}
            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-violet-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                if (currentData) handleModify(); else handleBuild();
              }
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleBuild}
            disabled={loading || !prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {currentData ? "Modify" : "Build"}
          </button>
          
          {currentData && (
            <button
              onClick={handleModify}
              disabled={loading || !prompt.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Update
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {response && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-white/70 whitespace-pre-wrap">{response}</p>
          </div>
        )}

        {currentData && currentData.content.length > 0 && (
          <div className="text-xs text-white/40">
            Components: {currentData.content.length}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-black/20 border-t border-white/5">
        <p className="text-[10px] text-white/30">
          Press Ctrl+Enter to build • AI generates Puck components
        </p>
      </div>
    </div>
  );
}

export function PuckAIButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg text-xs font-medium text-violet-300 transition-colors"
    >
      <Sparkles className="w-3.5 h-3.5" />
      AI Builder
    </button>
  );
}