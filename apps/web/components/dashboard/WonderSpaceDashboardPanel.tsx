"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Code2, Plus } from "lucide-react";
import WonderSpaceProjectNavigation from "./WonderSpaceProjectNavigation";
import WonderSpaceInlineCodeManager from "./WonderSpaceInlineCodeManager";
import WonderSpaceSourceHistory from "./WonderSpaceSourceHistory";

type DashboardProject = { id: string; name: string; tool?: string | null; type?: string | null };
export type WorkspaceTab = "overview" | "code" | "history";
const tabs: Array<{ key: WorkspaceTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "code", label: "Code" },
  { key: "history", label: "History" },
];

function projectTool(project: DashboardProject): { label: string; href: string } {
  const id = encodeURIComponent(project.id);
  const kind = (project.tool || project.type || "").toLowerCase();
  if (["workspace", "code"].includes(kind)) return { label: "Open files", href: `/dashboard/projects/${id}/files` };
  if (["game", "3d", "3d_scene", "playcanvas"].includes(kind)) return { label: "Open 3D builder", href: `/dashboard/3dhub?projectId=${id}` };
  if (kind === "npc") return { label: "Open NPC studio", href: `/wonder-play?projectId=${id}` };
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(kind)) return { label: "Open AI tools", href: `/dashboard/agents?projectId=${id}` };
  return { label: "Open visual builder", href: `/wonder-build/builder?projectId=${id}` };
}

/**
 * Project-keyed tab body. Going from A to B (even back to A) creates a fresh
 * instance, so neither historical "visited" state nor unsaved file data is
 * silently reused for the wrong project.
 */
function ProjectWorkspaceViews({
  selected, activeTab, unsavedCurrent, reportDirty,
}: {
  selected: DashboardProject | null;
  activeTab: WorkspaceTab;
  unsavedCurrent: boolean;
  reportDirty: (projectId: string, dirty: boolean) => void;
}) {
  const [visitedCode, setVisitedCode] = useState(false);
  const [visitedHistory, setVisitedHistory] = useState(false);
  useEffect(() => {
    if (activeTab === "code") setVisitedCode(true);
    if (activeTab === "history") setVisitedHistory(true);
  }, [activeTab]);
  const codeMounted = Boolean(selected && (activeTab === "code" || visitedCode));
  const historyMounted = Boolean(selected && (activeTab === "history" || visitedHistory));
  return (
    <>
      {codeMounted && (
        <div hidden={activeTab !== "code"} className="space-y-3 p-3 sm:p-4">
          <WonderSpaceInlineCodeManager project={selected} embedded onDirtyChange={reportDirty} />
          <WonderSpaceProjectNavigation projectId={selected?.id} advancedOnly />
        </div>
      )}
      {historyMounted && selected && (
        <div hidden={activeTab !== "history"} className="p-3 sm:p-4">
          <WonderSpaceSourceHistory key={selected.id} projectId={selected.id} hasUnsavedEdits={unsavedCurrent} />
        </div>
      )}
    </>
  );
}

/**
 * One project selector and three in-place views. Existing routes remain valid
 * for deep links and advanced workflows; they are not extra onboarding steps.
 * Once the user opens Code, keep its editor mounted across tab changes so
 * unsaved local edits aren't silently discarded by opening History.
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
  const [dirtyProjectId, setDirtyProjectId] = useState<string | null>(null);
  const reportDirty = useCallback((projectId: string, dirty: boolean) => {
    setDirtyProjectId(current => dirty ? projectId : current === projectId ? null : current);
  }, []);
  const selected = useMemo(
    () => projects.find(item => item.id === requestedProjectId) || projects[0] || null,
    [projects, requestedProjectId],
  );
  const unsavedCurrent = Boolean(selected && dirtyProjectId === selected.id);
  const requestedTab = searchParams.get("workspaceTab");
  const activeTab: WorkspaceTab = selected && tabs.some(tab => tab.key === requestedTab)
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
    if (projectId === selected?.id) return;
    if (unsavedCurrent && !window.confirm("This project has unsaved code edits. Switch anyway and discard them?")) return;
    setDirtyProjectId(null);
    // Project switching resets view to Overview, preventing stale editor focus.
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", projectId);
    params.delete("workspaceTab");
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  };
  const selectTab = (tab: WorkspaceTab) => {
    if (!selected && tab !== "overview") return;
    replaceUrl(selected?.id ?? null, tab);
  };

  useEffect(() => {
    // Establish URL-level project context even for a normal /dashboard visit.
    if (!selected || requestedProjectId === selected.id) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", selected.id);
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  }, [pathname, requestedProjectId, router, searchParams, selected]);

  const destination = selected ? projectTool(selected) : null;

  return (
    <section aria-label="WonderSpace dashboard" className="mb-5 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0b1929]">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-white">Project workspace</h2>
          <p className="mt-1 text-xs text-slate-400">
            Pick a project once. Code and project tools live together; history stays separate.
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

      {unsavedCurrent && (
        <p role="alert" className="mx-4 mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-100">
          You have unsaved code edits. Go to Code and save your file before switching projects or saving a version.
        </p>
      )}

      {activeTab === "overview" && (
        <div className="px-4 py-5 sm:px-5">
          {selected ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">{selected.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your project files and tools stay together in Code; saved versions stay in History.
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

      <ProjectWorkspaceViews key={selected?.id ?? "no-project"}
        selected={selected} activeTab={activeTab}
        unsavedCurrent={unsavedCurrent} reportDirty={reportDirty} />
    </section>
  );
}
