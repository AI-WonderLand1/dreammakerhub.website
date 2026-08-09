"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { logger } from '@/lib/logger';

const WEBSITE_EXAMPLES = [
  "A dark sci-fi portfolio for a 3D artist",
  "A luxury hotel landing page with booking",
  "A SaaS dashboard with analytics",
];

const GAME_EXAMPLES = [
  "A futuristic city at night with neon lights",
  "A tropical beach at sunset",
  "A space station orbiting Earth",
];

const FEATURED_TEMPLATES = [
  { id: "portfolio", name: "Developer Portfolio", type: "website", icon: "👨‍💻" },
  { id: "saas", name: "SaaS Landing", type: "website", icon: "💼" },
  { id: "blog", name: "Tech Blog", type: "website", icon: "📝" },
  { id: "dashboard", name: "Analytics Dashboard", type: "website", icon: "📊" },
  { id: "store", name: "E-commerce Store", type: "website", icon: "🛒" },
  { id: "agency", name: "Agency Website", type: "website", icon: "🎨" },
  { id: "fps", name: "FPS Arena", type: "game", icon: "🔫" },
  { id: "racing", name: "Racing Track", type: "game", icon: "🏎️" },
  { id: "puzzle", name: "Puzzle World", type: "game", icon: "🧩" },
  { id: "adventure", name: "Exploration World", type: "game", icon: "🗺️" },
  { id: "rpg", name: "RPG Village", type: "game", icon: "⚔️" },
  { id: "sci-fi", name: "Cyberpunk City", type: "game", icon: "🌃" },
];

type Project = {
  id: string;
  name: string;
  updated_at: string;
};

export default function HubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"website" | "game">("website");
  const [prompt, setPrompt] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | "websites" | "games" | "mine">("all");

  const examples = mode === "website" ? WEBSITE_EXAMPLES : GAME_EXAMPLES;

  useEffect(() => {
    if (user) {
      loadUserProjects();
    }
  }, [user]);

  async function loadUserProjects() {
    try {
      const res = await fetch("/api/builder/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      logger.error("Failed to load projects:", err);
    }
  }

  function handleBuild() {
    if (!prompt.trim()) return;
    if (mode === "website") {
      router.push(`/wonder-build/studio?prompt=${encodeURIComponent(prompt)}&type=website`);
    } else {
      router.push(`/game-builder/create?prompt=${encodeURIComponent(prompt)}`);
    }
  }

  function handleBlankWebsite() {
    router.push("/wonder-build/builder");
  }

  function handleBlankGame() {
    router.push("/wonder-build/playcanvas");
  }

  const filteredTemplates = FEATURED_TEMPLATES.filter((t) => {
    if (filter === "websites") return t.type === "website";
    if (filter === "games") return t.type === "game";
    return true;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* TOP: AI Bar */}
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-2">
          What are we building today?
        </h1>
        <p className="text-center text-white/40 mb-8">
          Describe your vision and AI will create it
        </p>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setMode("website")}
            className={`px-5 py-2 rounded-full font-medium transition-all ${
              mode === "website"
                ? "bg-violet-600 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            🌐 Website
          </button>
          <button
            onClick={() => setMode("game")}
            className={`px-5 py-2 rounded-full font-medium transition-all ${
              mode === "game"
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            🎮 Game
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBuild()}
            placeholder={examples[Math.floor(Math.random() * examples.length)]}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-white placeholder-white/30 outline-none transition-all focus:border-white/30 focus:ring-1 focus:ring-white/10"
          />
          <button
            onClick={handleBuild}
            disabled={!prompt.trim()}
            className={`rounded-xl px-6 py-3.5 font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === "website"
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {mode === "website" ? "Build" : "Create"}
          </button>
        </div>

        {/* Quick Examples */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-xs text-white/30 hover:text-white/60 bg-transparent hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE: Blank Quick-Starts */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleBlankWebsite}
            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-violet-950/30 to-transparent transition-all hover:border-violet-500/50 hover:bg-violet-950/50"
          >
            <div className="text-5xl">🌐</div>
            <h3 className="text-lg font-semibold text-white">Blank Website</h3>
            <p className="text-white/40 text-sm">Start fresh in WonderBuild Editor</p>
          </button>

          <button
            onClick={handleBlankGame}
            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-950/30 to-transparent transition-all hover:border-indigo-500/50 hover:bg-indigo-950/50"
          >
            <div className="text-5xl">🎮</div>
            <h3 className="text-lg font-semibold text-white">Blank Game Scene</h3>
            <p className="text-white/40 text-sm">Start in PlayCanvas Bridge</p>
            <p className="text-xs text-white/20">(Embedded editor)</p>
          </button>
        </div>
      </div>

      {/* BOTTOM: Library / Templates */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Templates & Projects</h2>
          {user && (
            <Link
              href="/dashboard/projects"
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              View All →
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All" },
            { id: "websites", label: "Websites" },
            { id: "games", label: "Games" },
            { id: "mine", label: "My Projects" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === tab.id
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* User's Projects (when filter is "mine") */}
          {filter === "mine" && user && (
            projects.length > 0 ? (
              projects.slice(0, 8).map((project) => (
                <Link
                  key={project.id}
                  href={`/wonder-build/builder?project=${project.id}`}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20"
                >
                  <div className="aspect-video bg-gradient-to-br from-violet-900/20 to-black flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                      {project.name || "Untitled"}
                    </h3>
                    <p className="text-xs text-white/30 mt-1">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-white/40">No projects yet</p>
                <p className="text-white/20 text-sm mt-1">Start building to see your projects here</p>
              </div>
            )
          )}

          {/* Templates */}
          {filter !== "mine" && filteredTemplates.map((template) => (
            <Link
              key={template.id}
              href={template.type === "website"
                ? `/wonder-build/studio?prompt=${encodeURIComponent(template.name)}&type=website`
                : `/game-builder/create?prompt=${encodeURIComponent(template.name)}`
              }
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/20"
            >
              <div className={`aspect-video flex items-center justify-center ${
                template.type === "website"
                  ? "bg-gradient-to-br from-violet-900/20 to-black"
                  : "bg-gradient-to-br from-indigo-900/20 to-black"
              }`}>
                <span className="text-3xl">{template.icon}</span>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-white/30 mt-1">
                  {template.type === "website" ? "Website" : "Game"}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Login Prompt for non-users */}
        {!user && filter === "mine" && (
          <div className="text-center py-12">
            <p className="text-white/40 mb-4">Sign in to see your projects</p>
            <Link
              href="/public-pages/auth"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-500 transition-all"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}