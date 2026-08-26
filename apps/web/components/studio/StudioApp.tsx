"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Box, Eye, Gamepad2, Film, Boxes, type LucideIcon } from "lucide-react";
import Studio3DFactory from "@/components/studio/Studio3DFactory";
import Studio360View from "@/components/studio/Studio360View";
import StudioGameBuilder from "@/components/studio/StudioGameBuilder";
import StudioMovieMaker from "@/components/studio/StudioMovieMaker";

type StudioPage = "factory" | "panorama" | "game" | "movie";

const PAGES: { id: StudioPage; label: string; icon: LucideIcon; sub: string }[] = [
  { id: "factory", label: "3D Factory", icon: Box, sub: "AI mesh generation" },
  { id: "panorama", label: "360 View", icon: Eye, sub: "Panorama environments" },
  { id: "game", label: "Game Builder", icon: Gamepad2, sub: "Levels & logic" },
  { id: "movie", label: "Movie Maker", icon: Film, sub: "Cinematic timeline" },
];

export default function StudioApp() {
  const [currentPage, setCurrentPage] = useState<StudioPage>("factory");

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 font-sans overflow-hidden select-none">
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
            <Boxes size={16} />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wide block text-white">3DHUB STUDIO</span>
            <span className="text-[10px] text-slate-400 font-mono block -mt-1">AI CORE v3.0</span>
          </div>
        </div>

        <nav className="flex space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {PAGES.map((page) => {
            const active = currentPage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <page.icon size={14} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium font-mono">GPU ENGINE READY</span>
          </div>
          <Link
            href="/dashboard/projects"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-emerald-900/20"
          >
            Back to Projects
          </Link>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-500">Loading studio…</div>}>
          {currentPage === "factory" && <Studio3DFactory />}
          {currentPage === "panorama" && <Studio360View />}
          {currentPage === "game" && <StudioGameBuilder />}
          {currentPage === "movie" && <StudioMovieMaker />}
        </Suspense>
      </main>
    </div>
  );
}
