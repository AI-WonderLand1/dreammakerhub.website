"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GameBuilderCreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/game-builder/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate scene");
      }

      // Redirect to preview
      router.push(`/play/${data.sceneId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">
            Describe Your 3D Scene
          </h1>
          <p className="text-white/60">
            Tell the AI what you want — it will create a 3D scene for you to preview and edit.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: A futuristic city at night with neon lights, flying cars, and a dark sky with stars. Include a ground plane with reflective material."
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 resize-none"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-8 py-3 rounded-full bg-green-600 text-white font-semibold shadow-lg shadow-green-900/40 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Scene...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Generate Scene
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Tips for better results:</h3>
          <ul className="text-sm text-white/50 space-y-2">
            <li>• Describe the environment (city, forest, space, beach)</li>
            <li>• Mention lighting (sunset, neon, moonlight)</li>
            <li>• Include objects (buildings, trees, vehicles)</li>
            <li>• Specify materials (metallic, glass, wood)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}