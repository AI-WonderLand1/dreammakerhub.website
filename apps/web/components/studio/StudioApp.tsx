"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Box, Eye, Gamepad2, Film, type LucideIcon } from "lucide-react";
import Studio3DFactory from "@/components/studio/Studio3DFactory";
import Studio360View from "@/components/studio/Studio360View";
import StudioGameBuilder from "@/components/studio/StudioGameBuilder";
import StudioMovieMaker from "@/components/studio/StudioMovieMaker";
import StudioContentBrowser from "@/components/studio/StudioContentBrowser";
import "./StudioEditor.css";

type StudioMode = "factory" | "panorama" | "game" | "movie";

const MODES: { id: StudioMode; label: string; icon: LucideIcon }[] = [
  { id: "factory", label: "3D Editor", icon: Box },
  { id: "panorama", label: "360 View", icon: Eye },
  { id: "game", label: "Game Builder", icon: Gamepad2 },
  { id: "movie", label: "Movie Maker", icon: Film },
];

/** A single editor route. Modes switch the central tool without leaving the workspace. */
export default function StudioApp() {
  const [mode, setMode] = useState<StudioMode>("factory");

  return (
    <div className="wonderplay-app">
      <div className="wonderplay-menu">
        <strong>WonderPlay</strong>
        <span>3D Studio</span>
        <span className="wonderplay-project">Viewport · Outliner · Details · Content Browser</span>
      </div>
      <div className="wonderplay-toolbar">
        <nav className="wonderplay-tabs" aria-label="3D tools">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>
              <Icon size={14} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>
        <Link className="wonderplay-back" href="/dashboard/projects"><ArrowLeft size={14} aria-hidden="true" /><span>Projects</span></Link>
      </div>
      <main className="wonderplay-main">
        <Suspense fallback={<p className="m-auto text-sm text-slate-400">Loading 3D Studio…</p>}>
          <div className="wonderplay-stack">
            <section className={mode === "factory" ? "wonderplay-factory" : "flex min-h-0 min-w-0 overflow-hidden"} aria-label={`${MODES.find((item) => item.id === mode)?.label} workspace`}>
              {mode === "factory" && <Studio3DFactory />}
              {mode === "panorama" && <Studio360View />}
              {mode === "game" && <StudioGameBuilder />}
              {mode === "movie" && <StudioMovieMaker />}
            </section>
            <StudioContentBrowser />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
