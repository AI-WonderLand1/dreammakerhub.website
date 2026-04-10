"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";

type WorkspaceType = "full" | "ide" | "playcanvas";
type WorkspaceStatus = "idle" | "provisioning" | "running" | "stopped" | "error";

type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
  url: string | null;
  playcanvasUrl: string | null;
  webglStudioUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function makeToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "\u2014";
  return new Date(value).toLocaleString();
}

function statusColor(status: WorkspaceStatus) {
  switch (status) {
    case "running":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
    case "provisioning":
      return "border-amber-400/35 bg-amber-500/15 text-amber-200";
    case "stopped":
      return "border-white/20 bg-white/5 text-white/60";
    case "error":
      return "border-red-400/35 bg-red-500/15 text-red-200";
    default:
      return "border-white/20 bg-white/5 text-white/50";
  }
}

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export default function CoderSettingsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    type: "full" as WorkspaceType,
    projectId: "",
  });

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = makeToastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/environments");
      if (!res.ok) throw new Error("Failed to load workspaces");
      const data = await res.json();
      const list: Workspace[] = data.environments ?? data.workspaces ?? [];
      setWorkspaces(list);
    } catch {
      pushToast("Could not load workspaces.", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const canProvision = useMemo(
    () => form.name.trim().length > 0 && form.type.length > 0,
    [form.name, form.type],
  );

  const provisionWorkspace = useCallback(async () => {
    if (!canProvision) return;
    setProvisioning(true);
    setErrorMessages((prev) => ({ ...prev, provision: "" }));
    try {
      const token = "";
      const res = await fetch("/api/environments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          projectId: form.projectId || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Provisioning failed (${res.status})`);
      }

      pushToast("Workspace provisioning started.", "success");
      setForm((prev) => ({ ...prev, name: "", projectId: "" }));
      await loadWorkspaces();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Provisioning failed";
      setErrorMessages((prev) => ({ ...prev, provision: message }));
      pushToast(message, "error");
    } finally {
      setProvisioning(false);
    }
  }, [canProvision, form, pushToast, loadWorkspaces]);

  const terminateWorkspace = useCallback(
    async (id: string) => {
      setBusyId(id);
      setErrorMessages((prev) => ({ ...prev, [id]: "" }));
      try {
        const res = await fetch(`/api/environments?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to terminate workspace");
        }

        pushToast("Workspace terminated.", "success");
        await loadWorkspaces();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to terminate workspace";
        setErrorMessages((prev) => ({ ...prev, [id]: message }));
        pushToast(message, "error");
      } finally {
        setBusyId(null);
      }
    },
    [pushToast, loadWorkspaces],
  );

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">
          Cloud IDE Workspaces
        </div>
        <p className="mt-2 text-sm text-white/60">
          Create isolated cloud development environments with a full code editor (code-server),
          PlayCanvas runtime, and WebGL Studio — each running in your own container.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Workspace Name
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="my-workspace"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-violet-400/40"
            />
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60">
            Workspace Type
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as WorkspaceType }))}
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-violet-400/40"
            >
              <option value="full">Full (IDE + PlayCanvas + WebGL Studio)</option>
              <option value="ide">IDE Only</option>
              <option value="playcanvas">PlayCanvas Only</option>
            </select>
          </label>

          <label className="space-y-2 text-xs font-black uppercase tracking-widest text-white/60 md:col-span-2">
            Project ID (optional)
            <input
              value={form.projectId}
              onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
              placeholder="Link to an existing project"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-medium normal-case tracking-normal text-white/85 outline-none focus:border-violet-400/40"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={provisionWorkspace}
            disabled={!canProvision || provisioning}
            className={cx(
              "h-10 rounded-xl border px-5 text-sm font-bold transition",
              canProvision && !provisioning
                ? "border-violet-400/30 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
                : "cursor-not-allowed border-white/10 bg-white/5 text-white/40",
            )}
          >
            {provisioning ? "Provisioning\u2026" : "Create Workspace"}
          </button>
        </div>

        {errorMessages.provision ? (
          <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessages.provision}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-black uppercase tracking-widest text-white/70">Workspaces</div>
          <div className="text-xs text-white/45">{loading ? "Loading\u2026" : `${workspaces.length} total`}</div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-white/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              <span className="ml-3 text-sm">Loading workspaces\u2026</span>
            </div>
          ) : workspaces.length === 0 ? (
            <EmptyState
              title="No workspaces yet"
              description="Create your first cloud IDE workspace above to get started."
            />
          ) : (
            <div className="space-y-3">
              {workspaces.map((ws) => (
                <article key={ws.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white/90">{ws.name || ws.id}</h3>
                      <span className={cx("rounded-md border px-2 py-1 text-xs font-semibold", statusColor(ws.status))}>
                        {ws.status}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">{ws.type}</span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-white/50">
                    <p>ID: <span className="font-mono text-white/65">{ws.id}</span></p>
                    {ws.url ? (
                      <p>
                        IDE:{" "}
                        <a href={ws.url} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline hover:text-violet-200">
                          {ws.url}
                        </a>
                      </p>
                    ) : null}
                    {ws.playcanvasUrl ? (
                      <p>
                        PlayCanvas:{" "}
                        <a href={ws.playcanvasUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200">
                          {ws.playcanvasUrl}
                        </a>
                      </p>
                    ) : null}
                    {ws.webglStudioUrl ? (
                      <p>
                        WebGL Studio:{" "}
                        <a href={ws.webglStudioUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline hover:text-emerald-200">
                          {ws.webglStudioUrl}
                        </a>
                      </p>
                    ) : null}
                    <p>Created: {formatDateTime(ws.createdAt)}</p>
                    <p>Updated: {formatDateTime(ws.updatedAt)}</p>
                  </div>

                  {errorMessages[ws.id] ? (
                    <div className="mt-2 rounded-lg border border-red-400/20 bg-red-500/10 p-2 text-xs text-red-200">
                      {errorMessages[ws.id]}
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-2">
                    {ws.url && ws.status === "running" ? (
                      <a
                        href={ws.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center rounded-lg border border-violet-300/30 bg-violet-500/10 px-3 text-xs font-bold text-violet-100 hover:bg-violet-500/20"
                      >
                        Open IDE
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void terminateWorkspace(ws.id)}
                      disabled={busyId === ws.id}
                      className={cx(
                        "h-9 rounded-lg border px-3 text-xs font-bold transition",
                        busyId === ws.id
                          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                          : "border-red-300/30 bg-red-500/10 text-red-100 hover:bg-red-500/20",
                      )}
                    >
                      {busyId === ws.id ? "Terminating\u2026" : "Terminate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-black uppercase tracking-widest text-white/70">Configuration</div>
        <p className="mt-2 text-sm text-white/60">
          To connect a self-hosted Coder instance, set the <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">CODER_ACCESS_URL</code> and{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">CODER_WILDCARD_ACCESS_URL</code> environment variables.
          See <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">coder.env</code> at the repository root for full configuration.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-violet-300/70">IDE Mode</div>
            <p className="mt-1 text-xs text-white/50">Full code-server IDE in the browser. Requires Coder or Docker runtime.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-300/70">PlayCanvas Mode</div>
            <p className="mt-1 text-xs text-white/50">Isolated PlayCanvas editor per workspace for 3D development.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-300/70">Full Mode</div>
            <p className="mt-1 text-xs text-white/50">
              IDE + PlayCanvas + WebGL Studio in a single container. Each workspace gets its own isolated environment
              with persistent storage and dedicated resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}