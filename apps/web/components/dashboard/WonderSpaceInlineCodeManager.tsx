"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Code2, ExternalLink, RotateCcw } from "lucide-react";
import RepositoryFileBrowser from "../../app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";

type DashboardProject = { id: string; name: string; tool?: string | null; type?: string | null };
type LoadState = "loading" | "ready" | "error";

/**
 * Separate, project-keyed component: asynchronous file mutations belonging
 * to an old project cannot update the newly selected project's file state.
 */
function ActiveProjectFiles({ project }: { project: DashboardProject }) {
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState<LoadState>("loading");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setFiles({});
    setError("");

    void (async () => {
      try {
        const response = await fetchAuthenticatedProject(
          `/api/projects/${encodeURIComponent(project.id)}/files`,
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.files || typeof result.files !== "object" || Array.isArray(result.files)) {
          throw new Error(
            response.status === 401
              ? "Sign in again to edit your project."
              : result.message || result.error || "Unable to load your project files.",
          );
        }
        const verifiedFiles: Record<string, string> = {};
        for (const [key, value] of Object.entries(result.files)) {
          if (typeof value === "string") verifiedFiles[key] = value;
        }
        if (!cancelled) {
          setFiles(verifiedFiles);
          setStatus("ready");
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to open your project files.");
          setStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [project.id, reload]);

  return (
    <div id="dashboard-inline-code" className="border-t border-white/10 p-3 sm:p-4">
      {status === "loading" && (
        <p role="status" className="px-2 py-5 text-sm text-slate-300">
          Loading {project.name} files…
        </p>
      )}
      {status === "error" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
          <span>{error}</span>
          <button type="button" onClick={() => setReload(x => x + 1)}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/40 px-3 py-1.5">
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}
      {status === "ready" && (
        <RepositoryFileBrowser
          projectId={project.id}
          projectType={project.tool || project.type}
          files={files}
          onFilesChange={setFiles}
        />
      )}
    </div>
  );
}

/**
 * First-party project navigator and file editor share a project ID, without
 * an external code host or starting a VM. The actual editor fetches lazily.
 */
export default function WonderSpaceInlineCodeManager({
  project, embedded = false,
}: {
  project: DashboardProject | null;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (embedded) return (
    <section aria-label="Native project code manager" className="overflow-hidden rounded-xl border border-cyan-400/20 bg-[#0a1727]">
      {project ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-semibold text-white">Edit {project.name}</p>
            <Link href={`/dashboard/projects/${encodeURIComponent(project.id)}/files`}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-200 hover:underline">
              <ExternalLink size={14} aria-hidden="true" /> Full-page editor
            </Link>
          </div>
          <ActiveProjectFiles key={project.id} project={project} />
        </>
      ) : (
        <p className="p-4 text-sm text-slate-400">Select a project to manage its files.</p>
      )}
    </section>
  );
  return (
    <section aria-label="Native project code manager" className="overflow-hidden rounded-xl border border-cyan-400/20 bg-[#0a1727]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Code2 size={19} className="shrink-0 text-cyan-300" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-white">Native code manager</h3>
            <p className="text-xs text-slate-400">
              {project ? `Edit ${project.name} directly in this dashboard` : "Select or create a project to manage files"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project && (
            <Link href={`/dashboard/projects/${encodeURIComponent(project.id)}/files`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-cyan-200 hover:bg-white/5">
              <ExternalLink size={14} /> Full-page editor
            </Link>
          )}
          <button type="button" disabled={!project} onClick={() => setOpen(value => !value)}
            aria-expanded={open} aria-controls="dashboard-inline-code"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {open ? "Collapse code" : "Open code here"}
          </button>
        </div>
      </div>
      {open && project && <ActiveProjectFiles key={project.id} project={project} />}
    </section>
  );
}
