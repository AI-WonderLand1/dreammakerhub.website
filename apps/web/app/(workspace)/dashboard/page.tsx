"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProjectImportExport from "./ProjectImportExport";
import SettingsMenu from "./components/SettingsMenu";
import { EmptyState, SkeletonGrid } from "@/app/components/feedback/EmptyState";
import { ToastStack, type ToastItem } from "@/app/components/feedback/ToastStack";

type Project = {
  id: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

function cx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function toastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function downloadFromExport(projectId: string) {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/export`, {
    method: "GET",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
  const filename = (m?.[1] ? decodeURIComponent(m[1]) : null) ?? `project-${projectId}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = toastId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/projects", { method: "GET" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to load projects (${res.status})`);
      }
      const json = (await res.json()) as any;
      const list: Project[] = Array.isArray(json) ? json : (json?.projects ?? []);
      setProjects(list);
      if (!list.length) {
        pushToast("No projects found yet.", "success");
      }
    } catch (e: any) {
      const message = e?.message ?? "Failed to load projects";
      setErr(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...projects];
    copy.sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });
    return copy;
  }, [projects]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#070718] to-black text-white">
      <ToastStack toasts={toasts} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">Workspace</div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Dashboard</h1>
            <div className="mt-2 text-white/55">Projects live here — import/export stays here (builder stays clean).</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              aria-label="Refresh projects"
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/80 transition hover:bg-white/10"
            >
              Refresh
            </button>

            <Link
              href="/wonder-build"
              className="inline-flex h-10 items-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/15"
            >
              Open Builder
            </Link>

            <SettingsMenu />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProjectImportExport onImported={load} />
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-widest text-white/70">Projects</div>
                <div className="text-xs text-white/40">{loading ? "Loading…" : `${sorted.length} total`}</div>
              </div>

              {err ? (
                <div className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
                  <div>{err}</div>
                  <button
                    type="button"
                    onClick={load}
                    className="mt-2 rounded-md border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-semibold"
                    aria-label="Retry loading projects"
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              <div className="mt-4">
                {loading ? (
                  <SkeletonGrid cards={4} />
                ) : sorted.length ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {sorted.map((p) => (
                      <div key={p.id} className="rounded-2xl border border-white/10 bg-[#0b1220]/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-bold text-white/90">{p.name || "Untitled Project"}</div>
                            <div className="mt-1 break-all text-xs text-white/45">{p.id}</div>
                            <div className="mt-2 text-[11px] text-white/35">
                              Updated:{" "}
                              <span className="text-white/55">
                                {p.updatedAt
                                  ? new Date(p.updatedAt).toLocaleString()
                                  : p.createdAt
                                  ? new Date(p.createdAt).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          <Link href={`/preview/${encodeURIComponent(p.id)}`} className="text-xs font-bold text-white/60 hover:text-white/80">
                            Preview →
                          </Link>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/wonder-build?projectId=${encodeURIComponent(p.id)}`}
                            className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/80 transition hover:bg-white/10"
                          >
                            Open
                          </Link>

                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={async () => {
                              setBusyId(p.id);
                              try {
                                await downloadFromExport(p.id);
                                pushToast("Project export downloaded.", "success");
                              } catch (e: any) {
                                const message = e?.message ?? "Export failed";
                                pushToast(message, "error");
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            aria-label={`Export project ${p.name || p.id}`}
                            className={cx(
                              "h-9 rounded-xl border px-3 text-[12px] font-bold transition",
                              "border-cyan-400/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15",
                              busyId === p.id && "cursor-not-allowed opacity-60"
                            )}
                          >
                            {busyId === p.id ? "Exporting…" : "Export"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No projects yet"
                    description="Create your first project in Wonder Build or import a project export to get started."
                    cta={
                      <Link
                        href="/wonder-build"
                        className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 text-sm font-bold"
                      >
                        Create First Project
                      </Link>
                    }
                  />
                )}
              </div>
            </div>

            <div className="mt-4 text-xs text-white/35">
              Export uses <code className="text-white/60">/api/projects/:id/export</code> and import uses <code className="text-white/60">/api/projects/import</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
