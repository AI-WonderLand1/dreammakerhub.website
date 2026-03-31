"use client";

import { Search, GitBranch, Terminal, CloudUpload, GitPullRequest, Save } from "lucide-react";
import { useState } from "react";
import toast, { Toaster } from "./toast";

type TheiaTopBarProps = {
  title?: string;
  projectId?: string;
};

async function parseResult(res: Response) {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);
  }
  return payload;
}

export default function TheiaTopBar({ title, projectId }: TheiaTopBarProps) {
  const [busyAction, setBusyAction] = useState<"push" | "pull" | "commit" | null>(null);

  const runGitAction = async (action: "push" | "pull" | "commit") => {
    if (!projectId && action !== "pull") {
      toast.error("Missing projectId for this action.");
      return;
    }

    setBusyAction(action);
    const toastId = toast.loading(`${action[0].toUpperCase()}${action.slice(1)} in progress…`);

    try {
      if (action === "push") {
        await parseResult(await fetch(`/api/projects/${encodeURIComponent(projectId as string)}/publish`, { method: "POST" }));
      } else if (action === "commit") {
        await parseResult(await fetch(`/api/projects/${encodeURIComponent(projectId as string)}/snapshots`, { method: "POST" }));
      } else {
        await parseResult(await fetch("/api/wonder-sync/pull", { method: "POST" }));
      }

      toast.success(`${action[0].toUpperCase()}${action.slice(1)} completed.`, { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || `${action} failed`, { id: toastId });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <Toaster />
      <header className="h-12 flex items-center justify-between px-3 bg-[#070014] border-b border-fuchsia-900/40 text-sm text-gray-200 z-40">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2" aria-label="Theia toolbar">
            <button className="px-2 py-1 rounded hover:bg-fuchsia-900/30" aria-label="File menu">File</button>
            <button className="px-2 py-1 rounded hover:bg-fuchsia-900/30" aria-label="Edit menu">Edit</button>
            <button className="px-2 py-1 rounded hover:bg-fuchsia-900/30" aria-label="View menu">View</button>
            <button className="px-2 py-1 rounded hover:bg-fuchsia-900/30" aria-label="Run menu">Run</button>
            <button className="px-2 py-1 rounded hover:bg-fuchsia-900/30" aria-label="Terminal menu">Terminal</button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs uppercase tracking-wider text-fuchsia-300 font-semibold">{title || "AI-WONDERLAND"}</div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
              <Search size={14} />
              <input className="bg-transparent outline-none text-sm w-40" placeholder="Search..." aria-label="Search code" />
            </div>
            <button className="px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1" aria-label="Current branch">
              <GitBranch size={14} /> Branch
            </button>
            <button className="px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1" aria-label="Open terminal">
              <Terminal size={14} /> Terminal
            </button>
            <button
              className="px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1 disabled:opacity-60"
              onClick={() => runGitAction("pull")}
              disabled={busyAction !== null}
              aria-label="Pull latest changes"
            >
              <GitPullRequest size={14} /> {busyAction === "pull" ? "Pulling…" : "Pull"}
            </button>
            <button
              className="px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1 disabled:opacity-60"
              onClick={() => runGitAction("commit")}
              disabled={busyAction !== null}
              aria-label="Create snapshot commit"
            >
              <Save size={14} /> {busyAction === "commit" ? "Committing…" : "Commit"}
            </button>
            <button
              className="px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1 disabled:opacity-60"
              onClick={() => runGitAction("push")}
              disabled={busyAction !== null}
              aria-label="Publish and push project"
            >
              <CloudUpload size={14} /> {busyAction === "push" ? "Pushing…" : "Push"}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
