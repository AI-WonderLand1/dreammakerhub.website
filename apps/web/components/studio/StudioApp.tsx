"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  ChevronDown,
  Code2,
  Eye,
  Film,
  FolderOpen,
  Gamepad2,
  Home,
  Menu,
  Pencil,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Studio3DFactory from "@/components/studio/Studio3DFactory";
import Studio360View from "@/components/studio/Studio360View";
import StudioGameFoundation from "@/components/studio/StudioGameFoundation";
import StudioMovieMaker from "@/components/studio/StudioMovieMaker";
import StudioContentBrowser from "@/components/studio/StudioContentBrowser";
import "./StudioEditor.css";
import "./StudioEditorMobile.css";
import "./StudioNavigation.css";

type StudioMode = "factory" | "panorama" | "game" | "movie";

const MODES: { id: StudioMode; label: string; icon: LucideIcon }[] = [
  { id: "factory", label: "3D Editor", icon: Box },
  { id: "panorama", label: "360 View", icon: Eye },
  { id: "game", label: "Game Builder", icon: Gamepad2 },
  { id: "movie", label: "Movie Maker", icon: Film },
];

const SITE_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/wonder-build/builder", label: "WonderBuild", icon: Pencil },
  { href: "/wonderspace", label: "WonderSpace IDE", icon: Code2 },
  { href: "/dashboard/npc", label: "My NPCs", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/** One editor route: site navigation is tucked into the top bar, not a permanent sidebar. */
export default function StudioApp() {
  const [mode, setMode] = useState<StudioMode>("factory");

  return (
    <div className="wonderplay-app">
      <div className="wonderplay-menu">
        <Link className="wonderplay-brand" href="/dashboard" aria-label="DreamMakerHub home">DreamMakerHub</Link>
        <span className="wonderplay-product-name">WonderPlay</span>
        <details className="wonderplay-site-menu">
          <summary><Menu size={14} aria-hidden="true" /> Navigate <ChevronDown size={12} aria-hidden="true" /></summary>
          <nav aria-label="DreamMakerHub navigation" className="wonderplay-site-links">
            {SITE_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}><Icon size={15} aria-hidden="true" /> {label}</Link>
            ))}
          </nav>
        </details>
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
              {mode === "game" && <StudioGameFoundation />}
              {mode === "movie" && <StudioMovieMaker />}
            </section>
            <StudioContentBrowser />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
