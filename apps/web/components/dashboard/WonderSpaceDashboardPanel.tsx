"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Code2, FolderOpen, Monitor, Plus } from "lucide-react";
import WonderSpaceProjectNavigation from "./WonderSpaceProjectNavigation";

type DashboardProject = { id: string; name: string; tool?: string | null; type?: string | null };

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
  const selectProject = (projectId: string) => {
    if (!projects.some(project => project.id === projectId)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", projectId);
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  };
  const selected = useMemo(
    () => projects.find(item => item.id === requestedProjectId) || projects[0] || null,
    [projects, requestedProjectId],
  );
  const editHref = selected
    ? `/dashboard/projects/${encodeURIComponent(selected.id)}/files`
    : "/wonderspace/browser";

  useEffect(() => {
    // Establish URL-level project context even for a normal /dashboard visit.
    if (!selected || requestedProjectId === selected.id) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("projectId", selected.id);
    router.replace(`${pathname}?${params.toString()}${window.location.hash}`, { scroll: false });
  }, [pathname, requestedProjectId, router, searchParams, selected]);

  return (
    <section aria-label="WonderSpace dashboard" className="mb-5 space-y-3">
      <div className="rounded-2xl border border-cyan-400/30 bg-[#0e2030] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[.17em] text-cyan-200">
              Available without a cloud VM
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">WonderSpace browser code editor</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Open your DreamMakerHub project, create files and folders, edit code, and save to the same
              account that powers your dashboard. The isolated Linux terminal is a separate pilot.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={editHref}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                <Code2 size={17} aria-hidden="true" /> {selected ? "Open selected project's editor" : "Open browser editor"}
              </Link>
              <Link href="/wonderspace"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-sm text-white hover:border-cyan-300/50">
                <Monitor size={16} aria-hidden="true" /> Linux IDE pilot
              </Link>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-xl border border-white/10 bg-black/20 p-3">
            <label htmlFor="wonderspace-selected-project" className="mb-2 block text-xs font-semibold text-cyan-200">
              Current project
            </label>
            {projects.length > 0 ? (
              <select id="wonderspace-selected-project" value={selected?.id ?? ""}
                onChange={event => selectProject(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#081525] px-3 py-2 text-sm text-white">
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            ) : (
              <p className="rounded-lg border border-dashed border-white/20 p-3 text-xs text-slate-300">
                Create a project to use the repository navigation.
              </p>
            )}
            {selected && (
              <Link href={`/dashboard/projects/${encodeURIComponent(selected.id)}`}
                className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-200 hover:underline">
                <FolderOpen size={14} aria-hidden="true" /> Open project overview
              </Link>
            )}
            <button type="button" onClick={onCreate}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/10">
              <Plus size={14} aria-hidden="true" /> Create a project
            </button>
          </div>
        </div>
      </div>
      <WonderSpaceProjectNavigation projectId={selected?.id} />
    </section>
  );
}
