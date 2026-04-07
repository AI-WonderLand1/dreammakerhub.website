"use client";

import { useEffect, useState } from "react";

export default function ModelExplorer() {
  const [models, setModels] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModels() {
      try {
        // Static list of Google AI models
        const googleModels = [
          {
            id: "gemini-1.5-flash",
            name: "Gemini 1.5 Flash",
            description: "Fast and efficient model for general tasks",
            context_length: 1048576,
          },
          {
            id: "gemini-1.5-pro",
            name: "Gemini 1.5 Pro",
            description: "Advanced model with enhanced capabilities",
            context_length: 2097152,
          },
          {
            id: "gemini-1.5-pro-vision",
            name: "Gemini 1.5 Pro Vision",
            description: "Model with vision capabilities",
            context_length: 2097152,
          },
        ];
        setModels(googleModels);
      } catch (err) {
        console.error("Failed to load models", err);
      } finally {
        setLoading(false);
      }
    }

    loadModels();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold tracking-wide text-slate-300">
        Models
      </h2>

      {loading && (
        <div className="text-slate-500 text-sm">Loading models…</div>
      )}

      {!loading && models.length === 0 && (
        <div className="text-slate-500 text-sm">No models found.</div>
      )}

      <div className="space-y-2">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={`w-full text-left px-3 py-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition ${
              selected === m.id ? "ring-2 ring-sky-500" : ""
            }`}
          >
            <div className="font-medium text-slate-200">{m.id}</div>
            <div className="text-xs text-slate-500">{m.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
