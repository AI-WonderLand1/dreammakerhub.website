'use client';

<<<<<<< HEAD
import { useState, useCallback } from "react";
import { Sparkles, Send, X, Loader2, RefreshCw, Wand2 } from "lucide-react";
=======
import { useState, useCallback, useEffect } from "react";
import { Sparkles, Send, X, Loader2, RefreshCw, Wand2, Plus, Layers, ArrowRight } from "lucide-react";
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
import { sendToAIBuilder, PuckData } from "@/lib/ai/puckBuilder";

interface PuckAIPanelProps {
  currentData: PuckData | null;
  onApplyData: (data: PuckData) => void;
  isOpen: boolean;
  onClose: () => void;
}

<<<<<<< HEAD
=======
const QUICK_PROMPTS = [
  { label: "Hero + Features", prompt: "Create a hero section with features below" },
  { label: "Pricing Page", prompt: "Build a pricing page with 3 plans" },
  { label: "Contact Form", prompt: "Add a contact form with split layout" },
  { label: "Testimonials", prompt: "Add customer testimonials section" },
  { label: "CTA Section", prompt: "Add a call-to-action banner" },
  { label: "FAQ", prompt: "Add an FAQ accordion section" },
];

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
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
<<<<<<< HEAD
=======
  const [activeTab, setActiveTab] = useState<"build" | "add" | "modify">("build");

  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setResponse("");
      setError("");
    }
  }, [isOpen]);
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

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

<<<<<<< HEAD
=======
  const handleAddComponent = useCallback(async (componentType: string) => {
    setLoading(true);
    setError("");
    
    try {
      const result = await sendToAIBuilder(
        `Add a ${componentType} component to the current page`,
        currentData || undefined
      );
      setResponse(result.response);
      
      if (result.puckData.content.length > 0) {
        const mergedData: PuckData = {
          content: [...(currentData?.content || []), ...result.puckData.content],
          root: result.puckData.root || { type: "Fragment", props: {} },
        };
        onApplyData(mergedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add component");
    } finally {
      setLoading(false);
    }
  }, [currentData, onApplyData]);

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
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

<<<<<<< HEAD
  const handleClear = useCallback(() => {
    setPrompt("");
    setResponse("");
    setError("");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[500px] bg-[#0a0a10]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
=======
  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
    handleBuild();
  };

  if (!isOpen) return null;

  const hasContent = currentData && currentData.content.length > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[480px] max-h-[600px] bg-[#0a0a10]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-white">AI Builder</span>
<<<<<<< HEAD
=======
          <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
            Drag & Drop Ready
          </span>
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

<<<<<<< HEAD
      <div className="p-4 space-y-4 overflow-y-auto max-h-[350px]">
        {currentData && currentData.content.length > 0 && (
          <div className="text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2">
=======
      <div className="px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("build")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "build" 
                ? "bg-violet-600 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Wand2 className="w-3 h-3 inline mr-1" />
            Build
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "add" 
                ? "bg-violet-600 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Add Component
          </button>
          <button
            onClick={() => setActiveTab("modify")}
            disabled={!hasContent}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === "modify" 
                ? "bg-violet-600 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <RefreshCw className="w-3 h-3 inline mr-1" />
            Modify
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {hasContent && activeTab !== "add" && (
          <div className="text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
            <Layers className="w-3 h-3" />
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
            Current: {currentData.content.map(c => c.type).join(", ")}
          </div>
        )}

<<<<<<< HEAD
        <div className="space-y-2">
          <label className="text-xs text-white/60">Describe what you want to build or modify:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={currentData ? "Modify the current page..." : "Build a landing page with hero, features, and pricing..."}
            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-violet-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                currentData ? handleModify() : handleBuild();
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
=======
        {activeTab === "build" && (
          <>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Describe your page:</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., landing page with hero, features grid, and pricing table..."
                className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-violet-500/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleBuild();
                  }
                }}
              />
            </div>

            <div>
              <p className="text-xs text-white/40 mb-2">Quick start templates:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => handleQuickPrompt(qp.prompt)}
                    disabled={loading}
                    className="flex items-center justify-between px-3 py-2 text-left rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors disabled:opacity-50"
                  >
                    <span className="text-white/80">{qp.label}</span>
                    <ArrowRight className="w-3 h-3 text-white/40" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "add" && (
          <div>
            <p className="text-xs text-white/40 mb-2">Add components to your page:</p>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {["Hero Section", "Features", "Pricing", "Testimonials", "FAQ", "Contact", "CTA", "Gallery"].map((comp) => (
                <button
                  key={comp}
                  onClick={() => handleAddComponent(comp)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3 text-violet-400" />
                  <span className="text-white/80">{comp}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "modify" && (
          <div className="space-y-2">
            <label className="text-xs text-white/60">How to modify:</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., change colors to dark theme, add animations, make it mobile-first..."
              className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-violet-500/50"
            />
          </div>
        )}
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786

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
<<<<<<< HEAD

        {currentData && currentData.content.length > 0 && (
          <div className="text-xs text-white/40">
            Components: {currentData.content.length}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-black/20 border-t border-white/5">
        <p className="text-[10px] text-white/30">
          Press Ctrl+Enter to build • AI generates Puck components
=======
      </div>

      <div className="p-4 border-t border-white/10">
        {activeTab === "build" && (
          <button
            onClick={handleBuild}
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Build Page
          </button>
        )}

        {activeTab === "modify" && (
          <button
            onClick={handleModify}
            disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Apply Changes
          </button>
        )}

        <p className="text-[10px] text-white/30 text-center mt-2">
          AI generates Puck components • Drag blocks from sidebar to reorder
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
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