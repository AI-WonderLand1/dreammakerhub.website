"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Download, FileCode2, FileJson2, Folder, Image as ImageIcon, Loader2, RefreshCw, Search, Video } from "lucide-react";

type ProjectAsset = { path: string; content: string };

function assetIcon(path: string) {
  const lower = path.toLowerCase();
  if (/\.(glb|gltf|fbx|obj|usd|usdz)$/.test(lower)) return Box;
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(lower)) return ImageIcon;
  if (/\.(mp4|webm|mov)$/.test(lower)) return Video;
  if (lower.endsWith(".json")) return FileJson2;
  return FileCode2;
}

export default function StudioContentBrowser() {
  const params = useSearchParams();
  const projectId = params.get("projectId")?.trim() || "";
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!projectId || projectId === "default") {
      setAssets([]);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Project files are unavailable (${res.status}).`);
        const data = await res.json() as { files?: Record<string, string> };
        return Object.entries(data.files ?? {}).map(([path, content]) => ({ path, content }));
      })
      .then((files) => {
        if (!controller.signal.aborted) setAssets(files);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load project files.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [projectId, reload]);

  const folders = useMemo(() => Array.from(new Set(assets.flatMap(({ path }) => {
    const segments = path.split("/");
    return segments.slice(0, -1).map((_, i) => segments.slice(0, i + 1).join("/"));
  }))).sort(), [assets]);

  const visible = useMemo(() => assets.filter(({ path }) => {
    const inFolder = !folder || path.startsWith(`${folder}/`);
    return inFolder && path.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => a.path.localeCompare(b.path)), [assets, folder, query]);

  const download = useCallback((asset: ProjectAsset) => {
    const blob = new Blob([asset.content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = asset.path.split("/").pop() || "asset";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <section className="wonderplay-content-browser" aria-label="Project content browser">
      <div className="wonderplay-content-header">
        <div className="wonderplay-content-heading"><Folder size={14} /> Content Browser <span>{assets.length} files</span></div>
        <label className="wonderplay-content-search"><Search size={13} /><span className="sr-only">Search project assets</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" /></label>
        <button type="button" onClick={() => setReload((value) => value + 1)} disabled={!projectId || projectId === "default" || loading} aria-label="Refresh project assets" title="Refresh project assets"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>
      <div className="wonderplay-content-body">
        <nav className="wonderplay-content-folders" aria-label="Project folders">
          <button type="button" className={!folder ? "is-active" : ""} onClick={() => setFolder("")}><Folder size={13} /> Content</button>
          {folders.map((entry) => <button type="button" key={entry} className={folder === entry ? "is-active" : ""} onClick={() => setFolder(entry)} title={entry}><Folder size={13} /><span>{entry.split("/").pop()}</span></button>)}
        </nav>
        <div className="wonderplay-content-assets">
          {!projectId || projectId === "default" ? <p className="wonderplay-content-message">Open a project to browse its real files. <Link href="/dashboard/projects">Choose a project</Link></p> : loading ? <p className="wonderplay-content-message"><Loader2 size={14} className="animate-spin" /> Loading project assets…</p> : error ? <p className="wonderplay-content-message" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></p> : visible.length === 0 ? <p className="wonderplay-content-message">{assets.length ? "No files match this folder or search." : "No project assets saved yet."}</p> : visible.map((asset) => {
            const Icon = assetIcon(asset.path);
            const isSelected = selected === asset.path;
            return <div className={`wonderplay-asset ${isSelected ? "is-selected" : ""}`} key={asset.path}>
              <button type="button" className="wonderplay-asset-select" onClick={() => setSelected(asset.path)} title={asset.path} aria-pressed={isSelected}><span className="wonderplay-asset-icon"><Icon size={24} /></span><span className="wonderplay-asset-name">{asset.path.split("/").pop()}</span></button>
              {isSelected && <button type="button" className="wonderplay-asset-download" onClick={() => download(asset)} title={`Download ${asset.path}`} aria-label={`Download ${asset.path}`}><Download size={13} /></button>}
            </div>;
          })}
        </div>
      </div>
      <div className="wonderplay-content-footer"><span>{folder ? `Content / ${folder}` : "Content"}</span><span>{selected || (projectId && projectId !== "default" ? `${assets.length} assets` : "No project selected")}</span></div>
    </section>
  );
}
