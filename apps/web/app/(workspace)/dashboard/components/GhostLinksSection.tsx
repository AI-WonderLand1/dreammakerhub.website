"use client";

import React, { useCallback, useEffect, useState } from "react";

type GhostLink = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount: number;
};

type Project = {
  id: string;
  name?: string;
};

export default function GhostLinksSection({
  projects,
  pushToast,
}: {
  projects: Project[];
  pushToast: (message: string, tone: "success" | "error" | "info") => void;
}) {
  const [ghosts, setGhosts] = useState<GhostLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [ghostName, setGhostName] = useState("");
  const [ghostDescription, setGhostDescription] = useState("");

  const loadGhosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ghost");
      if (res.ok) {
        const data = await res.json();
        setGhosts(data.ghosts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGhosts();
  }, [loadGhosts]);

  const createGhost = useCallback(async () => {
    if (!selectedProject) {
      pushToast("Select a project first", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          name: ghostName || `Ghost ${Date.now().toString(36)}`,
          description: ghostDescription,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create ghost");
      }
      const ghost = await res.json();

      // Copy link to clipboard
      const url = `${window.location.origin}/ghost/${ghost.ghostId}`;
      await navigator.clipboard.writeText(url);
      pushToast(`Ghost created! Link copied to clipboard.`, "success");

      setGhostName("");
      setGhostDescription("");
      setSelectedProject("");
      await loadGhosts();
    } catch (err: any) {
      pushToast(err.message || "Failed to create ghost", "error");
    } finally {
      setCreating(false);
    }
  }, [selectedProject, ghostName, ghostDescription, pushToast, loadGhosts]);

  const deleteGhost = useCallback(async (ghostId: string) => {
    try {
      await fetch(`/api/ghost/${ghostId}`, { method: "DELETE" });
      pushToast("Ghost deleted", "success");
      await loadGhosts();
    } catch {
      pushToast("Failed to delete ghost", "error");
    }
  }, [pushToast, loadGhosts]);

  const copyLink = useCallback(async (ghostId: string) => {
    const url = `${window.location.origin}/ghost/${ghostId}`;
    await navigator.clipboard.writeText(url);
    pushToast("Ghost link copied!", "success");
  }, [pushToast]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-purple-400">Time-Travel Ghosts</div>
          <p className="mt-1 text-[11px] text-white/40">
            Share project snapshots as instant-boot links. Anyone can click and run your project in 2 seconds.
          </p>
        </div>
        <div className="text-xs text-white/40">{loading ? "Loading…" : `${ghosts.length} ghosts`}</div>
      </div>

      {/* Create Ghost */}
      <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
        <p className="text-xs font-semibold text-purple-300 mb-3">Create New Ghost Link</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-xs text-white outline-none focus:border-purple-500/50"
          >
            <option value="">Select project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id.slice(0, 12)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={ghostName}
            onChange={(e) => setGhostName(e.target.value)}
            placeholder="Ghost name (optional)"
            className="rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
          />
          <input
            type="text"
            value={ghostDescription}
            onChange={(e) => setGhostDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-lg border border-white/10 bg-[#0d1117] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          onClick={createGhost}
          disabled={!selectedProject || creating}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? "Creating Ghost…" : "Create Ghost Link"}
        </button>
      </div>

      {/* Ghost List */}
      <div className="mt-4">
        {loading ? (
          <div className="text-xs text-white/40 animate-pulse py-4 text-center">Loading ghosts...</div>
        ) : ghosts.length === 0 ? (
          <div className="text-xs text-white/30 py-4 text-center">
            No ghost links yet. Create one from a project above.
          </div>
        ) : (
          <div className="space-y-2">
            {ghosts.map((ghost) => (
              <div
                key={ghost.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white/80">{ghost.name}</p>
                  {ghost.description && (
                    <p className="text-[10px] text-white/40 mt-0.5">{ghost.description}</p>
                  )}
                  <p className="text-[10px] text-white/30 mt-1">
                    {ghost.fileCount} files • {new Date(ghost.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/ghost/${ghost.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[10px] font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => copyLink(ghost.id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/50 hover:text-white/80 transition"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => deleteGhost(ghost.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[10px] text-red-400/60 hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
