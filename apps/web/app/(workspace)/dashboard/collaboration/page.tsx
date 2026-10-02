"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";

type Project = { id: string; name: string };
type SessionUser = {
  user_id: string;
  project_id: string;
  last_seen: string;
  is_active: boolean;
  cursor_position?: unknown;
};

export default function CollaborationPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => projects.find(project => project.id === projectId) ?? null, [projects, projectId]);

  const loadProjects = useCallback(async () => {
    const response = await fetchAuthenticatedProject("/api/projects");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(payload?.projects)) throw new Error(payload?.error || "Could not load projects.");
    const rows = payload.projects.map((project: any) => ({ id: String(project.id), name: String(project.name || "Project") }));
    setProjects(rows);
    setProjectId(current => rows.some((project: Project) => project.id === current) ? current : rows[0]?.id || "");
  }, []);

  const loadSessions = useCallback(async () => {
    if (!projectId) {
      setUsers([]);
      return;
    }
    const response = await fetch(`/api/collaboration?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || "Could not load collaboration sessions.");
    setUsers(Array.isArray(payload?.users) ? payload.users : []);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadProjects()
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Could not load projects."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadProjects]);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    setLoading(true);
    setError("");
    void loadSessions()
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Could not load sessions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadSessions, projectId]);

  useEffect(() => {
    if (!projectId) return;
    const heartbeat = async (active = true) => {
      await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, active }),
        keepalive: !active,
      }).catch(() => null);
    };

    void heartbeat(true);
    const id = window.setInterval(() => void heartbeat(true), 30_000);
    return () => {
      window.clearInterval(id);
      void heartbeat(false);
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`collaboration:${projectId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "collaboration_sessions",
        filter: `project_id=eq.${projectId}`,
      }, () => {
        void loadSessions();
      })
      .subscribe(status => setLive(status === "SUBSCRIBED"));

    return () => {
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [loadSessions, projectId]);

  return (
    <div className="space-y-5 text-white">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users size={22} /> Collaboration</h1>
        <p className="mt-1 text-sm text-white/50">Live collaboration presence for your AI WONDERLAND projects.</p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-white/50">Project</span>
            <select
              value={projectId}
              onChange={event => setProjectId(event.target.value)}
              disabled={projects.length === 0}
              className="w-full rounded-lg border border-white/15 bg-[#081525] px-3 py-2.5 text-sm"
            >
              {projects.length === 0 ? <option value="">No projects</option> : projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadSessions()}
            disabled={!projectId || loading}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <span className="mt-5 inline-flex items-center gap-2 text-xs text-white/45">
            <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`} />
            {live ? "Live" : "Connecting"}
          </span>
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{selected?.name || "Project"} collaborators</h2>
          <span className="text-xs text-white/45">{users.length} active</span>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-white/40">Loading active collaborators…</p>
        ) : users.length === 0 ? (
          <p className="mt-4 text-sm text-white/40">No active collaboration sessions for this project.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {users.map(user => (
              <article key={user.user_id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-semibold">User {user.user_id.slice(0, 8)}…</div>
                <div className="mt-1 text-xs text-white/45">Last seen {new Date(user.last_seen).toLocaleString()}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
