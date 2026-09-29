"use client";

import { useEffect, useState } from "react";
import { Download, GitCommitHorizontal, GitCompareArrows, RotateCcw } from "lucide-react";
import { fetchAuthenticatedProject } from "@/lib/wonderspace/browser-project-fetch";

type Version = {
  id: string;
  title: string;
  versionNumber: number;
  createdAt: string;
};
type Changes = { added: string[]; deleted: string[]; modified: string[] };
type Comparison = { version: Version; changes: Changes; unchanged: number };
type Props = { projectId: string };

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
};

/** One-click version checkpoints of already-saved files; no GitHub or VM. */
export default function WonderSpaceSourceHistory({ projectId }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [comparingId, setComparingId] = useState<string | null>(null);

  const endpoint = `/api/projects/${encodeURIComponent(projectId)}/source-history`;

  useEffect(() => {
    let cancelled = false;
    setVersions([]);
    setComparison(null);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await fetchAuthenticatedProject(endpoint);
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(body.versions)) {
          throw new Error(body.error || "Unable to load versions.");
        }
        if (!cancelled) setVersions(body.versions);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load versions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [endpoint]);

  async function saveVersion() {
    if (busy) return;
    setBusy(true);
    setError("");
    setComparison(null);
    try {
      const response = await fetchAuthenticatedProject(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: note.trim() || "Checkpoint" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.version?.id) {
        throw new Error(body.error || "Version could not be saved.");
      }
      setVersions(previous => [body.version, ...previous]);
      setNote("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Version could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function compareVersion(id: string) {
    if (busy) return;
    if (comparingId === id) {
      setComparingId(null);
      setComparison(null);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetchAuthenticatedProject(`${endpoint}?versionId=${encodeURIComponent(id)}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.changes) throw new Error(body.error || "Comparison unavailable.");
      setComparison(body);
      setComparingId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Comparison unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadVersion(version: Version) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetchAuthenticatedProject(
        `${endpoint}?versionId=${encodeURIComponent(version.id)}&format=zip`,
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Could not download this version.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      try {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `wonderspace-version-${version.versionNumber}.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="version-history" aria-label="Native source history"
      className="rounded-xl border border-white/10 bg-[#0c1828] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <GitCommitHorizontal size={20} className="text-cyan-300" aria-hidden="true" />
        <h3 className="font-semibold text-white">Version history</h3>
        <span className="rounded-full border border-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-200">DreamMakerHub</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Keep a checkpoint of files you've already saved. No GitHub or virtual machine required.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="min-w-[180px] flex-1">
          <span className="sr-only">Version name (optional)</span>
          <input value={note} onChange={event => setNote(event.target.value)}
            maxLength={100} placeholder="Version note (optional)"
            className="w-full rounded-lg border border-white/15 bg-[#08111e] px-3 py-2 text-sm text-white placeholder:text-white/40" />
        </label>
        <button type="button" disabled={busy || loading || versions.length >= 50}
          onClick={() => void saveVersion()}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
          {busy ? "Working…" : "Save version"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Checkpoints are manual and limited to 50; current release supports text projects up to 1 MB.
        This is portable history, not Git branches or automatic Linux IDE sync.
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {error}
        </p>
      )}
      {loading ? <p role="status" className="mt-3 text-xs text-slate-400">Loading versions…</p> :
        versions.length === 0 ? <p className="mt-3 text-xs text-slate-400">No checkpoints yet.</p> :
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {versions.map(version => (
            <div key={version.id} className="rounded-lg border border-white/10 bg-white/[.025] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    v{version.versionNumber} · {version.title}
                  </div>
                  <div className="text-[11px] text-slate-400">{formatTime(version.createdAt)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button disabled={busy} type="button"
                    onClick={() => void compareVersion(version.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-cyan-200 disabled:opacity-50">
                    <GitCompareArrows size={13} aria-hidden="true" /> Compare
                  </button>
                  <button disabled={busy} type="button"
                    onClick={() => void downloadVersion(version)}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-cyan-200 disabled:opacity-50">
                    <Download size={13} aria-hidden="true" /> ZIP
                  </button>
                </div>
              </div>
              {comparingId === version.id && comparison && (
                <div className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-300">
                  <p>Changes since this version: {comparison.changes.added.length} added,
                    {" "}{comparison.changes.modified.length} modified,
                    {" "}{comparison.changes.deleted.length} removed.</p>
                  {([
                    ["Added", comparison.changes.added],
                    ["Modified", comparison.changes.modified],
                    ["Removed", comparison.changes.deleted],
                  ] as const).map(([label, paths]) => paths.length > 0 && (
                    <p key={label} className="mt-1 break-all">
                      <span className="font-semibold">{label}:</span> {paths.join(", ")}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>}
    </section>
  );
}
