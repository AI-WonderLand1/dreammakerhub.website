"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Destination = {
  label: string;
  href: string;
  hints: string[];
};

const DESTINATIONS: Destination[] = [
  { label: "Home", href: "/", hints: ["landing", "start"] },
  { label: "Dashboard", href: "/dashboard", hints: ["projects", "workspace"] },
  { label: "Wonder Build", href: "/wonder-build", hints: ["builder", "ai builder"] },
  { label: "PlayCanvas", href: "/wonder-build/playcanvas", hints: ["3d", "scene", "engine"] },
  { label: "Puck Builder", href: "/wonder-build/puck", hints: ["ui", "design", "blocks"] },
  { label: "Docs", href: "/docs", hints: ["documentation", "help"] },
  { label: "Community", href: "/community", hints: ["chat", "people"] },
  { label: "Marketplace", href: "/marketplace", hints: ["assets", "templates"] },
  { label: "Support", href: "/support", hints: ["ticket", "issue"] },
  { label: "Settings", href: "/settings", hints: ["account", "preferences"] },
  { label: "Cloud Storage", href: "/settings/cloud-storage", hints: ["byoc", "storage"] },
  { label: "Coder IDE", href: "/wonderspace/ide", hints: ["ide", "code", "coder"] },
];

function scoreDestination(destination: Destination, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  if (destination.href.toLowerCase() === q || destination.label.toLowerCase() === q) return 100;
  let score = 0;
  if (destination.label.toLowerCase().includes(q)) score += 50;
  if (destination.href.toLowerCase().includes(q)) score += 40;
  if (destination.hints.some((hint) => hint.includes(q) || q.includes(hint))) score += 25;
  return score;
}

export function SpiritGuideSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideAnswer, setGuideAnswer] = useState("");
  const [lastMiss, setLastMiss] = useState("");

  const recommendation = useMemo(() => {
    const ranked = DESTINATIONS
      .map((d) => ({ destination: d, score: scoreDestination(d, `${lastMiss} ${guideAnswer}`) }))
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].destination : null;
  }, [guideAnswer, lastMiss]);

  const navigateFromQuery = (text: string) => {
    const ranked = DESTINATIONS
      .map((d) => ({ destination: d, score: scoreDestination(d, text) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (best && best.score > 0) {
      router.push(best.destination.href);
      setQuery("");
      return true;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const ok = navigateFromQuery(query);
    if (!ok) {
      setLastMiss(query);
      setGuideAnswer("");
      setGuideOpen(true);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="pointer-events-auto flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where do you want to go?"
          className="h-9 w-64 rounded-full border border-white/20 bg-black/65 px-4 text-sm text-white placeholder:text-white/45 backdrop-blur outline-none focus:border-cyan-400/70"
          aria-label="Navigation search"
        />
        <button
          type="submit"
          className="h-9 rounded-full border border-white/25 bg-white/10 px-3 text-xs font-semibold text-white/85 hover:bg-white/15"
        >
          Go
        </button>
      </form>

      {guideOpen ? (
        <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#070a14] p-4 text-white shadow-2xl">
            <p className="text-sm font-semibold text-cyan-300">✨ Spirit Guide AI</p>
            <p className="mt-2 text-sm text-white/80">
              I couldn't place "{lastMiss}". Tell me what you meant, and I’ll guide you.
            </p>

            <input
              value={guideAnswer}
              onChange={(e) => setGuideAnswer(e.target.value)}
              placeholder="Example: project settings, 3d editor, docs"
              className="mt-3 h-10 w-full rounded-lg border border-white/20 bg-black/40 px-3 text-sm outline-none focus:border-cyan-400/70"
            />

            {recommendation ? (
              <p className="mt-3 text-sm text-emerald-300">
                Best match: <span className="font-semibold">{recommendation.label}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/60">I still need a little more detail.</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/75"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!recommendation}
                onClick={() => {
                  if (!recommendation) return;
                  router.push(recommendation.href);
                  setGuideOpen(false);
                  setQuery("");
                }}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
              >
                Take me there
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
