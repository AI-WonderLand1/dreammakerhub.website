"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Code2, FolderOpen, Plus, Settings2 } from "lucide-react";
import WonderSpaceProjectNavigation from "./WonderSpaceProjectNavigation";
import WonderSpaceInlineCodeManager from "./WonderSpaceInlineCodeManager";
import WonderSpaceSourceHistory from "./WonderSpaceSourceHistory";

type DashboardProject = { id: string; name: string; tool?: string | null; type?: string | null };
export type WorkspaceTab = "overview" | "code" | "history" | "tools";
const tabs: Array<{ key: WorkspaceTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "code", label: "Code" },
  { key: "history", label: "History" },
  { key: "tools", label: "More tools" },
];

function projectTool(project: DashboardProject): { label: string; href: string } {
  const id = encodeURIComponent(project.id);
  const kind = (project.tool || project.type || "").toLowerCase();
  if (["workspace", "code"].includes(kind)) return { label: "Linux IDE status", href: `/wonderspace?projectId=${id}` };
  if (["game", "3d", "3d_scene", "playcanvas"].includes(kind)) return { label: "Open 3D builder", href: `/dashboard/3dhub?projectId=${id}` };
  if (kind === "npc") return { label: "Open NPC studio", href: `/wonder-play?projectId=${id}` };
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(kind)) return { label: "Open AI tools", href: `/dashboard/agents?projectId=${id}` };
  return { label: "Open visual builder", href: `/wonder-build/builder?projectId=${id}` };
}

/**
 * One project selector and four in-place views. Existing routes remain valid
 * for deep links and advanced workflows; they are not extra onboarding steps.
 * Once the user opens Code, keep its editor mounted across tab changes so
 * unsaved local edits aren't silently discarded by opening History or Tools.
 */
export default function WonderSpaceDashboardPanel({
  projects,
  requestedProjectId,
  onCreate,
}: {
  projects: DashboardProject[];
  requestedProjectId?: string | null;
  onCreate: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visitedCodeProject, setVisitedCodeProject] = useState<string | null>(null);
  const [visitedHistoryProject, setVisitedHistoryProject] = useState<string | null>(null);
  const selected = useMemo(
    () => projects.find(item => item.id === requestedProjectId) || projects[0] || null,
    [projects, requestedProjectId],
  );
  const requestedTab = searchParams.get("workspaceTab");
  const activeTab: WorkspaceTab = tabs.some(tab => tab.key === requestedTab)
    ? requestedTab as WorkspaceTab : "overview";

  const replaceUrl = (projectId: string | null, tab: WorkspaceTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) params.set("projectId", projectId);
    else params.delete("projectId");
    if (tab === "overview") params.delete("workspaceTab");
    else params.set("workspaceTab", tab);
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}${window.location.hash}`, { scroll: false });
  };
  const selectProject = (projectId: string) => {
    if (!projects.some(project => project.id === projectId)) return;
    // Project switching resets view to Overview, preventing stale editor focus.
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", projectId);
    params.delete("workspaceTab");
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  };
  const selectTab = (tab: WorkspaceTab) => {
    if (!selected && tab !== "overview") return;
    if (tab === "code") setVisitedCodeProject(selected?.id ?? null);
    if (tab === "history") setVisitedHistoryProject(selected?.id ?? null);
    replaceUrl(selected?.id ?? null, tab);
  };

  useEffect(() => {
    // Establish URL-level project context even for a normal /dashboard visit.
    if (!selected || requestedProjectId === selected.id) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", selected.id);
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  }, [pathname, requestedProjectId, router, searchParams, selected]);

  useEffect(() => {
    // Also support directly opening a bookmarked /dashboard?workspaceTab=code link.
    if (!selected) return;
    if (activeTab === "code") setVisitedCodeProject(selected.id);
    if (activeTab === "history") setVisitedHistoryProject(selected.id);
  }, [activeTab, selected]);

  const codeMounted = Boolean(selected && (activeTab === "code" || visitedCodeProject === selected.id));
  const historyMounted = Boolean(selected && (activeTab === "history" || visitedHistoryProject === selected.id));
  const destination = selected ? projectTool(selected) : null;

  return (
    <section aria-label="WonderSpace dashboard" className="mb-5 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0b1929]">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-white">Project workspace</h2>
          <p className="mt-1 text-xs text-slate-400">
            Pick a project once. Edit, save versions and find its tools here.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {projects.length > 0 ? (
            <label className="min-w-0 flex-1 sm:w-60 sm:flex-none">
              <span className="sr-only">Current project</span>
              <select value={selected?.id ?? ""} onChange={event => selectProject(event.target.value)}
                aria-label="Current project"
                className="w-full rounded-lg border border-white/15 bg-[#081525] px-3 py-2.5 text-sm text-white">
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
          ) : (
            <span className="text-xs text-slate-400">No project yet</span>
          )}
          <button type="button" onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2.5 text-sm font-semibold text-slate-950">
            <Plus size={15} aria-hidden="true" /> New project
          </button>
        </div>
      </div>

      <nav aria-label="Project workspace views" className="flex items-center gap-1 overflow-x-auto border-y border-white/10 px-3 sm:px-4">
        {tabs.map(tab => (
          <button key={tab.key} type="button"
            aria-current={activeTab === tab.key ? "page" : undefined}
            disabled={!selected && tab.key !== "overview"}
            onClick={() => selectTab(tab.key)}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
              activeTab === tab.key
                ? "border-cyan-400 font-semibold text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="px-4 py-5 sm:px-5">
          {selected ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">{selected.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your project files, versions and tools stay connected to this project.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => selectTab("code")}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">
                  <Code2 size={16} aria-hidden="true" /> Edit files here
                </button>
                {destination && (
                  <Link href={destination.href}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm text-slate-100 hover:bg-white/5">
                    {destination.label}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">Create your first project to open its editor and version history.</p>
          )}
        </div>
      )}

      {codeMounted && (
        <div hidden={activeTab !== "code"} className="p-3 sm:p-4">
          <WonderSpaceInlineCodeManager project={selected} embedded />
        </div>
      )}
      {historyMounted && selected && (
        <div hidden={activeTab !== "history"} className="p-3 sm:p-4">
          <WonderSpaceSourceHistory key={selected.id} projectId={selected.id} />
        </div>
      )}
      {activeTab === "tools" && (
        <div className="space-y-3 p-3 sm:p-4">
          <WonderSpaceProjectNavigation projectId={selected?.id} />
          {selected && (
            <Link href={`/dashboard/projects/${encodeURIComponent(selected.id)}`}
              className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:underline">
              <FolderOpen size={16} aria-hidden="true" /> Project details and settings
            </Link>
          )}
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Settings2 size={14} aria-hidden="true" />
            Git pull requests and cloud CI are shown as planned until their backends are ready.
          </p>
        </div>
      )}
    </section>
  );
}
