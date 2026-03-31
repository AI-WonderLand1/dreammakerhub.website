"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";

type SessionUser = {
  id?: string;
  user_id?: string;
  project_id?: string;
  last_seen?: string;
};

function toastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CollaborationPage() {
  const [projectId, setProjectId] = useState("");
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = toastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const trimmed = projectId.trim();
      const res = await fetch(`/api/collaboration?projectId=${encodeURIComponent(trimmed)}`);
      const payload = await res.json();

      if (!res.ok) {
        const message = payload?.error || `Failed to load collaboration sessions (${res.status})`;
        setError(message);
        pushToast(message, "error");
        return;
      }

      const list = Array.isArray(payload?.users) ? payload.users : [];
      setUsers(list);
      if (!list.length) {
        pushToast("No active collaborators found.", "success");
      }
    } catch (err: any) {
      const message = err?.message || "Network error while loading collaboration sessions";
      setError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [projectId, pushToast]);

  const canLoad = useMemo(() => projectId.trim().length > 0, [projectId]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 text-white">
      <ToastStack toasts={toasts} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xl font-bold">Collaboration Sessions</h2>
        <p className="mt-2 text-sm text-white/65">
          Monitor active collaborators for a project. Uses <code>/api/collaboration</code> with inline retry + toast feedback.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID"
            aria-label="Project ID"
            className="h-10 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 text-sm"
          />
          <button
            type="button"
            onClick={loadSessions}
            disabled={!canLoad || loading}
            aria-label="Load collaboration sessions"
            className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load Sessions"}
          </button>
          <Link
            href="/wonder-build"
            className="inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold hover:bg-white/10"
          >
            Open Builder
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            <div>{error}</div>
            <button
              type="button"
              onClick={loadSessions}
              className="mt-2 rounded-md border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-semibold"
              aria-label="Retry loading collaboration sessions"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-5">
          {loading ? (
            <SkeletonGrid cards={3} />
          ) : users.length === 0 ? (
            <EmptyState
              title="No active collaboration sessions"
              description="Start collaborating in Wonder Build to see active user sessions here."
              cta={
                <Link
                  href="/wonder-build"
                  className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 text-sm font-bold"
                >
                  Start a Collaboration Session
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {users.map((user, index) => (
                <div key={`${user.user_id || "user"}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-semibold">User: {user.user_id || "Unknown"}</div>
                  <div className="mt-1 text-xs text-white/60">Project: {user.project_id || projectId}</div>
                  <div className="mt-1 text-xs text-white/50">Last seen: {user.last_seen || "Unknown"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
