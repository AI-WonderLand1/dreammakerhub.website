"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Box, ChevronDown, Code2, Eye, Film, FolderOpen,
  Gamepad2, Home, Image as ImageIcon, LayoutTemplate, Library,
  Menu, Pencil, Settings, Sparkles, Users, type LucideIcon,
} from "lucide-react";
import Studio3DFactory from "@/components/studio/Studio3DFactory";
import Studio360View from "@/components/studio/Studio360View";
import StudioGameFoundation from "@/components/studio/StudioGameFoundation";
import StudioMovieMaker from "@/components/studio/StudioMovieMaker";
import StudioContentBrowser from "@/components/studio/StudioContentBrowser";
import StudioTemplatesPanel from "@/components/studio/StudioTemplatesPanel";
import "./StudioEditor.css";
import "./StudioEditorMobile.css";
import "./StudioNavigation.css";

const SandboxStudio = dynamic(
  () => import("@/lib/wonder3d/components/SandboxStudio").then((module) => module.SandboxStudio),
  { ssr: false, loading: () => <p className="p-5 text-sm text-slate-400">Loading 3D generator…</p> },
);
const ImageStudioWorkspace = dynamic(
  () => import("@/components/studio/ImageStudioWorkspace"),
  { ssr: false, loading: () => <p className="p-5 text-sm text-slate-400">Loading image generator…</p> },
);

type Workspace = "assets" | "world" | "capture" | "library";
type AssetTool = "3d" | "image";
type CreateTool = "game" | "factory";
type CaptureTool = "movie" | "panorama";
type LibraryTool = "assets" | "templates";

type ToolOption = { id: string; label: string; icon: LucideIcon };

const WORKSPACES: { id: Workspace; label: string; icon: LucideIcon }[] = [
  { id: "assets", label: "3D & Image Assets", icon: Sparkles },
  { id: "world", label: "World & Game", icon: Gamepad2 },
  { id: "capture", label: "Video & Capture", icon: Film },
  { id: "library", label: "Templates & Library", icon: Library },
];
const ASSET_TOOLS: ToolOption[] = [
  { id: "3d", label: "3D Generator", icon: Box },
  { id: "image", label: "Image Generator", icon: ImageIcon },
];
const CREATE_TOOLS: ToolOption[] = [
  { id: "game", label: "PlayCanvas · WebGL", icon: Gamepad2 },
  { id: "factory", label: "Procedural Scene", icon: Box },
];
const CAPTURE_TOOLS: ToolOption[] = [
  { id: "movie", label: "Movie", icon: Film },
  { id: "panorama", label: "360 View", icon: Eye },
];
const LIBRARY_TOOLS: ToolOption[] = [
  { id: "assets", label: "Project Assets", icon: FolderOpen },
  { id: "templates", label: "Scene Templates", icon: LayoutTemplate },
];

const SITE_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/wonder-build/builder", label: "WonderBuild", icon: Pencil },
  { href: "/wonderspace", label: "WonderSpace IDE", icon: Code2 },
  { href: "/dashboard/npc", label: "My NPCs", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/** One WonderPlay workspace. Saved projects and the existing engine routes remain intact. */
export default function StudioApp() {
  const router = useRouter();
  const params = useSearchParams();
  const [workspace, setWorkspace] = useState<Workspace>("world");
  const [assetTool, setAssetTool] = useState<AssetTool>("3d");
  const [createTool, setCreateTool] = useState<CreateTool>("game");
  const [captureTool, setCaptureTool] = useState<CaptureTool>("movie");
  const [libraryTool, setLibraryTool] = useState<LibraryTool>("assets");

  useEffect(() => {
    const tab = params.get("tab");
    if (tab === "assets" || tab === "world" || tab === "capture" || tab === "library") {
      setWorkspace(tab);
    }
    const tool = params.get("tool");
    if (tab === "assets" && (tool === "3d" || tool === "image")) setAssetTool(tool);
    if (tab === "world" && (tool === "game" || tool === "factory")) setCreateTool(tool);
    if (tab === "capture" && (tool === "movie" || tool === "panorama")) setCaptureTool(tool);
    if (tab === "library" && (tool === "assets" || tool === "templates")) setLibraryTool(tool);
  }, [params]);

  const tools = workspace === "assets" ? ASSET_TOOLS :
    workspace === "world" ? CREATE_TOOLS :
    workspace === "capture" ? CAPTURE_TOOLS : LIBRARY_TOOLS;
  const activeTool = workspace === "assets" ? assetTool :
    workspace === "world" ? createTool :
    workspace === "capture" ? captureTool : libraryTool;

  function updateUrl(tab: Workspace, tool?: string) {
    const next = new URLSearchParams(params.toString());
    next.set("tab", tab);
    if (tool) next.set("tool", tool);
    else next.delete("tool");
    router.replace("/dashboard/3dhub?" + next.toString(), { scroll: false });
  }

  function selectWorkspace(tab: Workspace) {
    setWorkspace(tab);
    updateUrl(tab);
  }

  function selectTool(tool: string) {
    if (workspace === "assets") setAssetTool(tool as AssetTool);
    else if (workspace === "world") setCreateTool(tool as CreateTool);
    else if (workspace === "capture") setCaptureTool(tool as CaptureTool);
    else setLibraryTool(tool as LibraryTool);
    updateUrl(workspace, tool);
  }

  return (
    <div className="wonderplay-app">
      <div className="wonderplay-menu">
        <Link className="wonderplay-brand" href="/dashboard" aria-label="AI WONDERLAND home">AI WONDERLAND</Link>
        <span className="wonderplay-product-name">WonderPlay</span>
        <details className="wonderplay-site-menu">
          <summary><Menu size={14} aria-hidden="true" /> Navigate <ChevronDown size={12} aria-hidden="true" /></summary>
          <nav aria-label="AI WONDERLAND navigation" className="wonderplay-site-links">
            {SITE_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}><Icon size={15} aria-hidden="true" /> {label}</Link>
            ))}
          </nav>
        </details>
        <span className="wonderplay-project">One workspace · Shared project · Assets → Build → Capture</span>
      </div>
      <div className="wonderplay-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          <nav className="wonderplay-tabs" aria-label="WonderPlay workspaces">
            {WORKSPACES.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={workspace === id} onClick={() => selectWorkspace(id)}>
                <Icon size={14} aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
          <nav className="wonderplay-context-tools" aria-label="Workspace tools">
            {tools.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={activeTool === id} onClick={() => selectTool(id)}>
                <Icon size={13} aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
        </div>
        <Link className="wonderplay-back" href="/dashboard/projects"><ArrowLeft size={14} aria-hidden="true" /><span>Projects</span></Link>
      </div>
      <main className="wonderplay-main">
        <Suspense fallback={<p className="m-auto text-sm text-slate-400">Loading WonderPlay…</p>}>
          {workspace === "assets" ? (
            <div className="h-full min-h-0 w-full overflow-hidden" aria-label="3D and image asset creation">
              {assetTool === "3d" ? <SandboxStudio availableAssets={[]} embedded /> :
                <div className="h-full w-full overflow-y-auto"><ImageStudioWorkspace /></div>}
            </div>
          ) : workspace === "library" ? (
            <div className="wonderplay-library h-full min-h-0 w-full overflow-hidden" aria-label="Templates and project library">
              {libraryTool === "templates" ? <StudioTemplatesPanel /> : <StudioContentBrowser />}
            </div>
          ) : (
            <div className="wonderplay-stack">
              <section className={workspace === "world" && createTool === "factory" ? "wonderplay-factory" : "flex min-h-0 min-w-0 overflow-hidden"}
                aria-label={workspace === "world" ? "World and game builder" : "Video and capture"}>
                {workspace === "world" && createTool === "factory" && <Studio3DFactory />}
                {workspace === "world" && createTool === "game" && <StudioGameFoundation />}
                {workspace === "capture" && captureTool === "movie" && <StudioMovieMaker />}
                {workspace === "capture" && captureTool === "panorama" && <Studio360View />}
              </section>
              <StudioContentBrowser />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
