"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Eye, Sparkles } from "lucide-react";
import RepositoryFileBrowser from "../RepositoryFileBrowser";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";
import WonderSpaceProjectNavigation from "@/components/dashboard/WonderSpaceProjectNavigation";
import WonderSpaceSourceHistory from "@/components/dashboard/WonderSpaceSourceHistory";

type Project = {
  id: string;
  name: string;
  tool?: string | null;
  type?: string | null;
  description?: string | null;
  updatedAt?: string;
  updated_at?: string;
};

const normalizeType = (value?: string | null) => (value || "").toLowerCase();

const projectTypeLabel = (value?: string | null) => {
  const type = normalizeType(value);
  if (["workspace", "code"].includes(type)) return "Code / Files";
  if (["game", "3d", "3d_scene", "playcanvas"].includes(type)) return "3D Experience";
  if (type === "npc") return "NPC AI";
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(type)) return "AI App";
  return "Website";
};

export default function ProjectCodeManagerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unsavedEdits, setUnsavedEdits] = useState(false);
  const unsavedRef = useRef(false);
  const reportUnsaved = useCallback((unsaved: boolean) => {
    unsavedRef.current = unsaved;
    setUnsavedEdits(unsaved);
  }, []);

  useEffect(() => {
    // Protect reload/tab close and capture all in-app links (including the
    // shared dashboard header/sidebar). Do not persist unsaved source content.
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!unsavedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmNavigation = (event: MouseEvent) => {
      if (!unsavedRef.current || event.defaultPrevented || event.button !== 0 ||
          event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || link.target === "_blank") return;
      let next: URL;
      try { next = new URL(link.href, window.location.href); } catch { return; }
      const here = new URL(window.location.href);
      if (next.origin === here.origin && next.pathname === here.pathname &&
          next.search === here.search) return; // Hash-only moves are safe.
      if (!window.confirm("You have unsaved changes. Leave this editor and discard them?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        unsavedRef.current = false;
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", confirmNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", confirmNavigation, true);
    };
  }, []);

  useEffect(() => {
    if (!unsavedEdits) return;
    // A same-URL history entry gives client-side Back a chance to confirm.
    const currentUrl = window.location.href;
    window.history.pushState({ ...window.history.state, __wonderSpaceDirtyEditor: true }, "", currentUrl);
    let listening = true;
    const onBack = () => {
      if (!listening || !unsavedRef.current) return;
      if (!window.confirm("You have unsaved changes. Leave this editor and discard them?")) {
        window.history.pushState({ ...window.history.state, __wonderSpaceDirtyEditor: true }, "", currentUrl);
        return;
      }
      listening = false;
      unsavedRef.current = false;
      window.removeEventListener("popstate", onBack, true);
      window.history.back();
    };
    window.addEventListener("popstate", onBack, true);
    return () => {
      listening = false;
      window.removeEventListener("popstate", onBack, true);
    };
  }, [unsavedEdits]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [projectResponse, filesResponse] = await Promise.all([
          fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}`),
          fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}/files`),
        ]);

        if (projectResponse.status === 401 || filesResponse.status === 401) {
          throw new Error("Your session expired. Sign in again to open your project files.");
        }
        const projectData = await projectResponse.json().catch(() => ({}));
        if (!projectResponse.ok || !projectData?.project) {
          throw new Error(projectData?.message || "Project not found");
        }

        const fileData = await filesResponse.json().catch(() => ({}));
        if (!filesResponse.ok) {
          throw new Error(fileData?.message || fileData?.error || "Project files could not be loaded");
        }

        if (!cancelled) {
          setProject(projectData.project);
          setFiles(fileData?.files && typeof fileData.files === "object" ? fileData.files : {});
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to open code manager");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const tool = project?.tool || project?.type || "wonderbuild";
  const projectQuery = `projectId=${encodeURIComponent(projectId)}`;
  const initialPath = searchParams.get("path");


  if (loading) {
    return <div className="grid min-h-[55vh] place-items-center text-sm text-white/45">Opening AI WONDERLAND Quick IDE...</div>;
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="font-semibold text-red-200">Quick IDE could not open.</p>
        <p className="mt-2 text-sm text-red-200/70">{error || "Project not found"}</p>
        {error.includes("Sign in") && (
          <Link href={`/public-pages/auth?redirectTo=${encodeURIComponent(`/dashboard/projects/${projectId}/files`)}`} className="mt-3 block text-sm font-semibold text-cyan-300 hover:underline">Sign in again</Link>
        )}
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">← Back to workspace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] text-white">
      {unsavedEdits && (
        <p role="status" className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          Unsaved changes in the editor. Save your file before leaving this page.
        </p>
      )}
      <header className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1423]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/dashboard" className="text-cyan-300 hover:text-cyan-200">Workspace</Link>
              <span className="text-white/25">/</span>
              <Link href={`/dashboard/projects/${project.id}`} className="truncate font-semibold text-white hover:text-violet-200">{project.name}</Link>
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                {projectTypeLabel(tool)}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/35">Fast browser IDE: edit files, save versions, preview, and use AI without starting a VM or container.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/agents?${projectQuery}`}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/15"
            >
              <Sparkles size={15}/> Ask AI Wonderland
            </Link>
            <Link
              href={`/preview/${encodeURIComponent(project.id)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-3 py-2 text-xs font-bold shadow-lg shadow-violet-950/30"
            >
              <Eye size={15}/> Preview
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <WonderSpaceProjectNavigation projectId={project.id} active="code" />
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>
      )}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <RepositoryFileBrowser
            projectId={project.id}
            projectType={tool}
            files={files}
            initialPath={initialPath}
            onFilesChange={setFiles}
            onUnsavedChange={reportUnsaved}
          />
        </main>

        <aside className="space-y-4">
          <WonderSpaceSourceHistory key={project.id} projectId={project.id} />
        </aside>
      </div>
    </div>
  );
}
