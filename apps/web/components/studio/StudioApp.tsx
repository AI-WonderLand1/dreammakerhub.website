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

type Workspace = "create" | "capture";
type CreateTool = "game" | "factory";
type CaptureTool = "movie" | "panorama";

const WORKSPACES: { id: Workspace; label: string; icon: LucideIcon }[] = [
  { id: "create", label: "Create", icon: Gamepad2 },
  { id: "capture", label: "Capture", icon: Film },
];

const CREATE_TOOLS: { id: CreateTool; label: string; icon: LucideIcon }[] = [
  { id: "game", label: "Game World", icon: Gamepad2 },
  { id: "factory", label: "3D Scene", icon: Box },
];

const CAPTURE_TOOLS: { id: CaptureTool; label: string; icon: LucideIcon }[] = [
  { id: "movie", label: "Movie", icon: Film },
  { id: "panorama", label: "360 View", icon: Eye },
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
  const [workspace, setWorkspace] = useState<Workspace>("create");
  const [createTool, setCreateTool] = useState<CreateTool>("game");
  const [captureTool, setCaptureTool] = useState<CaptureTool>("movie");
  const activeTool = workspace === "create" ? createTool : captureTool;

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
        <div className="flex min-w-0 items-center gap-3">
          <nav className="wonderplay-tabs" aria-label="WonderPlay workspaces">
            {WORKSPACES.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={workspace === id} onClick={() => setWorkspace(id)}>
                <Icon size={14} aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
          <nav className="wonderplay-context-tools" aria-label={workspace === "create" ? "Create tools" : "Capture tools"}>
            {(workspace === "create" ? CREATE_TOOLS : CAPTURE_TOOLS).map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={activeTool === id} onClick={() => workspace === "create" ? setCreateTool(id as CreateTool) : setCaptureTool(id as CaptureTool)}>
                <Icon size={13} aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
        </div>
        <Link className="wonderplay-back" href="/dashboard/projects"><ArrowLeft size={14} aria-hidden="true" /><span>Projects</span></Link>
      </div>
      <main className="wonderplay-main">
        <Suspense fallback={<p className="m-auto text-sm text-slate-400">Loading 3D Studio…</p>}>
          <div className="wonderplay-stack">
            <section className={activeTool === "factory" ? "wonderplay-factory" : "flex min-h-0 min-w-0 overflow-hidden"} aria-label={`${workspace === "create" ? "Create" : "Capture"} workspace`}>
              {activeTool === "factory" && <Studio3DFactory />}
              {activeTool === "panorama" && <Studio360View />}
              {activeTool === "game" && <StudioGameFoundation />}
              {activeTool === "movie" && <StudioMovieMaker />}
            </section>
            <StudioContentBrowser />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
