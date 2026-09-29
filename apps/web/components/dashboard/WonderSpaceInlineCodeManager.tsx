"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Code2, ExternalLink, RotateCcw } from "lucide-react";
import RepositoryFileBrowser from "../../app/(workspace)/dashboard/projects/[id]/RepositoryFileBrowser";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";

type DashboardProject = { id: string; name: string; tool?: string | null; type?: string | null };
type LoadState = "idle" | "loading" | "ready" | "error";

/**
 * The dashboard and dedicated code-manager route use the same first-party
 * project ID, owner-scoped API, and actual file editor. No repository host,
 * cloud VM, or external account is required to edit project files.
 */
export default function WonderSpaceInlineCodeManager({ project }: { project: DashboardProject | null }) {
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState<LoadState>("idle");
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const projectId = project?.id ?? null;

  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;

    setStatus("loading");
    setLoadedProjectId(null);
    setFiles({});
    setError("");

    void (async () => {
      try {
        const response = await fetchAuthenticatedProject(`/api/projects/${encodeURIComponent(projectId)}/files`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.files || typeof result.files !== "object" || Array.isArray(result.files)) {
          throw new Error(
            response.status === 401
              ? "Sign in again to edit your project."
              : result.message || result.error || "Unable to load your project files.",
          );
        }
        // Only server-verified project files are exposed to the editor.
        const verifiedFiles: Record<string, string> = {};
        for (const [key, value] of Object.entries(result.files)) {
          if (typeof value === "string") verifiedFiles[key] = value;
        }
        if (!cancelled) {
          setFiles(verifiedFiles);
          setLoadedProjectId(projectId);
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
  }, [open, projectId, reload]);

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
            {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
            {open ? "Collapse code" : "Open code here"}
          </button>
        </div>
      </div>
      {open && project && (
        <div id="dashboard-inline-code" className="border-t border-white/10 p-3 sm:p-4">
          {(status === "loading" || status === "idle" || loadedProjectId !== projectId) && status !== "error" &&
            <p role="status" className="px-2 py-5 text-sm text-slate-300">Loading {project.name} files…</p>}
          {status === "error" &&
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
              <span>{error}</span>
              <button type="button" onClick={() => setReload(x => x + 1)}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/40 px-3 py-1.5">
                <RotateCcw size={14} /> Retry
              </button>
            </div>}
          {status === "ready" && loadedProjectId === projectId &&
            <RepositoryFileBrowser
              key={projectId} projectId={projectId}
              projectType={project.tool || project.type}
              files={files} onFilesChange={setFiles}
            />}
        </div>
      )}
    </section>
  );
}
