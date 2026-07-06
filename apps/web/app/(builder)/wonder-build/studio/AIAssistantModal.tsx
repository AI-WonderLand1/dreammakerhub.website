"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Send, X, Loader2, RefreshCw, Wand2, Plus, Layers, ArrowRight } from "lucide-react";
import { sendToAIBuilder, type PuckData } from "@/lib/ai/puckBuilder";

interface AIAssistantModalProps {
  currentData: PuckData | null;
  onApplyData: (data: PuckData) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  { label: "Hero + Features", prompt: "Create a hero section with features below" },
  { label: "Pricing Page", prompt: "Build a pricing page with 3 plans" },
  { label: "Contact Form", prompt: "Add a contact form with split layout" },
  { label: "Testimonials", prompt: "Add customer testimonials section" },
  { label: "CTA Section", prompt: "Add a call-to-action banner" },
  { label: "FAQ", prompt: "Add an FAQ accordion section" },
];

export default function AIAssistantModal({
  currentData,
  onApplyData,
  isOpen,
  onClose,
}: AIAssistantModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"build" | "add" | "modify">("build");

  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setResponse("");
      setError("");
    }
  }, [isOpen]);

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

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
    handleBuild();
  };

  if (!isOpen) return null;

  const hasContent = currentData && currentData.content.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a0a10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-5 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-white">AI Assistant</span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Magic Builder</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="px-6 py-3 bg-white/5 border-b border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("build")}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "build" 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 inline mr-1.5" />
              Build
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "add" 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1.5" />
              Add Component
            </button>
            <button
              onClick={() => setActiveTab("modify")}
              disabled={!hasContent}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === "modify" 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Modify
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {hasContent && activeTab !== "add" && (
            <div className="text-xs text-white/40 bg-white/5 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-white/5">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>Current: {currentData.content.map(c => c.type).join(", ")}</span>
            </div>
          )}

          {activeTab === "build" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 ml-1">Describe your vision:</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., landing page with hero, features grid, and a pricing table..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleBuild();
                    }
                  }}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-white/40 mb-3 ml-1">Quick start templates:</p>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      disabled={loading}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="font-medium">{qp.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/20" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "add" && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 ml-1">Select components to append to your page:</p>
              <div className="grid grid-cols-2 gap-3">
                {["Hero Section", "Features", "Pricing", "Testimonials", "FAQ", "Contact", "CTA", "Gallery"].map((comp) => (
                  <button
                    key={comp}
                    onClick={() => handleAddComponent(comp)}
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <Plus className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="text-white/80 font-medium">{comp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "modify" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 ml-1">How to modify:</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., change colors to dark theme, add animations, make it mobile-first..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {response && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed">{response}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          {activeTab === "build" && (
            <button
              onClick={handleBuild}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Generate with AI
            </button>
          )}

          {activeTab === "modify" && (
            <button
              onClick={handleModify}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Apply Changes
            </button>
          )}

          <p className="text-[10px] text-white/30 text-center mt-4 font-medium">
            The AI processes your request through Architect, Builder, and Reviewer agents.
          </p>
        </div>
      </div>
    </div>
  );
}
