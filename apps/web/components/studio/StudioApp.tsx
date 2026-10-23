"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Box, ChevronDown, Code2, Download, Eye, Film,
  FolderOpen, Gamepad2, Home, Image as ImageIcon, LayoutTemplate,
  Menu, Pencil, Save, Settings, Sparkles, UploadCloud, Users,
  type LucideIcon,
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

type Step = "pick" | "edit" | "publish";
type PickTool = "3d" | "image";
type EditTool = "game" | "factory" | "model" | "movie" | "panorama";
type LibraryView = "assets" | "templates";
type ToolOption = { id: string; label: string; icon: LucideIcon };

const STEPS: { id: Step; label: string; icon: LucideIcon }[] = [
  { id: "pick", label: "1. Pick", icon: FolderOpen },
  { id: "edit", label: "2. Edit", icon: Pencil },
  { id: "publish", label: "3. Publish", icon: UploadCloud },
];
const PICK_TOOLS: ToolOption[] = [
  { id: "3d", label: "3D Assets", icon: Box },
  { id: "image", label: "Image Assets", icon: ImageIcon },
];
const EDIT_TOOLS: ToolOption[] = [
  { id: "game", label: "PlayCanvas Game & World", icon: Gamepad2 },
  { id: "factory", label: "Scene Editor", icon: Box },
  { id: "model", label: "3D Model Preview", icon: Sparkles },
  { id: "movie", label: "Movie & Shots", icon: Film },
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

/**
 * Pick, Edit, Publish share a URL and a projectId. The standalone old routes
 * remain supported for bookmarks and scenes that have not been migrated.
 */
export default function StudioApp() {
  const router = useRouter();
  const params = useSearchParams();
  const legacyTab = params.get("tab");
  const rawStep = params.get("step");
  const step: Step = rawStep === "pick" || rawStep === "edit" || rawStep === "publish"
    ? rawStep
    : legacyTab === "assets" || legacyTab === "library"
      ? "pick"
      : legacyTab === "world" || legacyTab === "capture"
        ? "edit"
        : "pick";

  const pickTool: PickTool = params.get("pickTool") === "image" ||
    (legacyTab === "assets" && params.get("tool") === "image") ? "image" : "3d";
  const legacyEditTool = legacyTab === "capture" ? params.get("tool") : legacyTab === "world" ? params.get("tool") : null;
  const requestedEditTool = params.get("editTool") || (rawStep === "edit" ? params.get("tool") : null) || legacyEditTool;
  const editTool: EditTool = requestedEditTool === "factory" || requestedEditTool === "model" ||
    requestedEditTool === "movie" || requestedEditTool === "panorama" ? requestedEditTool : "game";
  const libraryView: LibraryView = params.get("view") === "templates" ||
    (legacyTab === "library" && params.get("tool") === "templates") ? "templates" : "assets";
  const projectId = params.get("projectId")?.trim() || "";
  const sceneId = params.get("sceneId")?.trim() || params.get("scene")?.trim() || "";

  function navigate(nextStep: Step, updates: Record<string, string> = {}) {
    const next = new URLSearchParams(params.toString());
    next.set("step", nextStep);
    next.delete("tab");
    next.delete("tool");
    for (const [key, value] of Object.entries(updates)) next.set(key, value);
    router.replace("/dashboard/3dhub?" + next.toString(), { scroll: false });
  }

  function chooseTool(id: string) {
    if (step === "pick") navigate("pick", { pickTool: id });
    if (step === "edit") navigate("edit", { editTool: id });
  }

  return (
    <div className="wonderplay-app">
      <div className="wonderplay-menu">
        <Link className="wonderplay-brand" href="/dashboard" aria-label="AI WONDERLAND home">AI WONDERLAND</Link>
        <span className="wonderplay-product-name">WonderPlay Creator Studio</span>
        <details className="wonderplay-site-menu">
          <summary><Menu size={14} aria-hidden="true" /> Navigate <ChevronDown size={12} aria-hidden="true" /></summary>
          <nav aria-label="AI WONDERLAND navigation" className="wonderplay-site-links">
            {SITE_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}><Icon size={15} aria-hidden="true" /> {label}</Link>
            ))}
          </nav>
        </details>
        <span className="wonderplay-project">Pick assets & templates → Edit worlds, games & shots → Save & export</span>
      </div>
      <div className="wonderplay-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          <nav className="wonderplay-tabs" aria-label="WonderPlay three-step workflow">
            {STEPS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={step === id} onClick={() => navigate(id)}>
                <Icon size={14} aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
          {step !== "publish" && (
            <nav className="wonderplay-context-tools" aria-label={step === "pick" ? "Asset generation tools" : "Creative editing tools"}>
              {(step === "pick" ? PICK_TOOLS : EDIT_TOOLS).map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" aria-pressed={(step === "pick" ? pickTool : editTool) === id} onClick={() => chooseTool(id)}>
                  <Icon size={13} aria-hidden="true" /> {label}
                </button>
              ))}
            </nav>
          )}
        </div>
        <Link className="wonderplay-back" href="/dashboard/projects"><ArrowLeft size={14} aria-hidden="true" /><span>Projects</span></Link>
      </div>
      <main className="wonderplay-main">
        <Suspense fallback={<p className="m-auto text-sm text-slate-400">Loading WonderPlay…</p>}>
          {step === "pick" ? (
            <div className="wonderplay-stack" aria-label="Pick assets, generate models and browse your library">
              <section className="min-h-0 min-w-0 overflow-hidden" aria-label="3D and image asset generators">
                {pickTool === "3d"
                  ? <SandboxStudio availableAssets={[]} embedded />
                  : <div className="h-full w-full overflow-y-auto"><ImageStudioWorkspace /></div>}
              </section>
              <section className="wonderplay-library-dock" aria-label="Library and scene templates">
                <div className="wonderplay-library-switch">
                  <span className="font-semibold text-slate-200">Library</span>
                  <button type="button" aria-pressed={libraryView === "assets"} onClick={() => navigate("pick", { view: "assets" })}>
                    <FolderOpen size={13} /> Project assets
                  </button>
                  <button type="button" aria-pressed={libraryView === "templates"} onClick={() => navigate("pick", { view: "templates" })}>
                    <LayoutTemplate size={13} /> Scene templates
                  </button>
                  <button type="button" className="wonderplay-next-step" onClick={() => navigate("edit")}>Next: Edit →</button>
                </div>
                <div className="wonderplay-library-content">
                  {libraryView === "templates" ? <StudioTemplatesPanel /> : <StudioContentBrowser />}
                </div>
              </section>
            </div>
          ) : step === "edit" ? (
            <div className="wonderplay-stack" aria-label="Edit 3D models, game worlds, scenes and movies">
              <section className={editTool === "factory" ? "wonderplay-factory" : "flex min-h-0 min-w-0 overflow-hidden"}
                aria-label="3D creative editor">
                {editTool === "game" && <StudioGameFoundation />}
                {editTool === "factory" && <Studio3DFactory />}
                {editTool === "model" && <SandboxStudio availableAssets={[]} embedded />}
                {editTool === "movie" && <StudioMovieMaker />}
                {editTool === "panorama" && <Studio360View />}
              </section>
              <div className="wonderplay-edit-dock">
                <div className="wonderplay-library-switch">
                  <span>Saved project assets</span>
                  <button type="button" className="wonderplay-next-step" onClick={() => navigate("publish")}>Next: Publish →</button>
                </div>
                <div className="wonderplay-library-content"><StudioContentBrowser /></div>
              </div>
            </div>
          ) : (
            <div className="wonderplay-stack" aria-label="Publish and export options">
              <section className="wonderplay-publish overflow-y-auto bg-[#101724] p-4 sm:p-7">
                <div className="mx-auto max-w-5xl">
                  <h1 className="text-xl font-bold text-white">Publish & Export</h1>
                  <p className="mt-2 text-sm text-slate-300">Finish with the output your project actually supports. Assets, saved game levels, and scene previews use different formats.</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <article className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                      <Download size={21} className="text-cyan-300" aria-hidden="true" />
                      <h2 className="mt-2 font-semibold">3D model · GLB</h2>
                      <p className="mt-2 min-h-14 text-xs leading-relaxed text-slate-400">Select a generated or saved model in 3D Studio and use its real Export GLB action.</p>
                      <button type="button" className="wonderplay-publish-action" onClick={() => navigate("pick", { pickTool: "3d" })}>Open GLB export</button>
                    </article>
                    <article className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                      <Save size={21} className="text-cyan-300" aria-hidden="true" />
                      <h2 className="mt-2 font-semibold">Game world · Project save</h2>
                      <p className="mt-2 min-h-14 text-xs leading-relaxed text-slate-400">PlayCanvas saves a level into your selected project. Saving a level is not a deployed playable game.</p>
                      <button type="button" className="wonderplay-publish-action" onClick={() => navigate("edit", { editTool: "game" })}>Open level save</button>
                    </article>
                    <article className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                      <Film size={21} className="text-cyan-300" aria-hidden="true" />
                      <h2 className="mt-2 font-semibold">Movie · Saved shots</h2>
                      <p className="mt-2 min-h-14 text-xs leading-relaxed text-slate-400">Open the movie tool to save choreography and shot data. MP4 render/export is not yet integrated.</p>
                      <button type="button" className="wonderplay-publish-action" onClick={() => navigate("edit", { editTool: "movie" })}>Open movie editor</button>
                    </article>
                  </div>
                  {sceneId && (
                    <Link className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300 underline" href={`/play/${encodeURIComponent(sceneId)}`}>
                      <Eye size={15} aria-hidden="true" /> Open existing scene preview
                    </Link>
                  )}
                  <p role="note" className="mt-4 rounded-md border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200">
                    Public game hosting, playable build deployment and photorealistic movie rendering have not been verified in this unified flow. This step will not claim a deployment succeeded when it only saved project files.
                  </p>
                  {!projectId && <p className="mt-3 text-xs text-slate-400">Open a project from Projects to enable project-level saves and file downloads.</p>}
                </div>
              </section>
              <div className="wonderplay-edit-dock">
                <div className="wonderplay-library-switch"><span>Saved project files · Select an asset to download</span></div>
                <div className="wonderplay-library-content"><StudioContentBrowser /></div>
              </div>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
