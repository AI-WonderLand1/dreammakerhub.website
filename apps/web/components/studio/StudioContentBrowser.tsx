"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Download, FileCode2, FileJson2, Folder, Image as ImageIcon, Loader2, RefreshCw, Search, Video } from "lucide-react";

type ProjectAsset = { path: string; content: string };

function fileIcon(path: string) {
  const name = path.toLowerCase();
  if (/\.(glb|gltf|fbx|obj|usd|usdz)$/.test(name)) return Box;
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(name)) return ImageIcon;
  if (/\.(mp4|webm|mov)$/.test(name)) return Video;
  return name.endsWith(".json") ? FileJson2 : FileCode2;
}

export default function StudioContentBrowser() {
  const params = useSearchParams();
  const projectId = params.get("projectId")?.trim() || "";
  const [files, setFiles] = useState<ProjectAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!projectId || projectId === "default") {
      setFiles([]);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Project assets unavailable (${response.status}).`);
        const data = await response.json() as { files?: Record<string, string> };
        return Object.entries(data.files ?? {}).map(([path, content]) => ({ path, content }));
      })
      .then((results) => { if (!controller.signal.aborted) setFiles(results); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unable to load project assets."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectId, reload]);

  const folders = useMemo(() => Array.from(new Set(files.flatMap(({ path }) => {
    const parts = path.split("/");
    return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/"));
  }))).sort(), [files]);
  const visible = useMemo(() => files.filter(({ path }) => (!folder || path.startsWith(`${folder}/`)) && path.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => a.path.localeCompare(b.path)), [files, folder, query]);

  function download(asset: ProjectAsset) {
    const url = URL.createObjectURL(new Blob([asset.content], { type: "application/octet-stream" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = asset.path.split("/").pop() || "asset";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <section className="wonderplay-browser" aria-label="Project content browser">
    <div className="wonderplay-browser-header">
      <div className="wonderplay-browser-title"><Folder size={14} /> Content Browser <span>{files.length} assets</span></div>
      <label className="wonderplay-browser-search"><Search size={13}/><span className="sr-only">Search project assets</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets"/></label>
      <button type="button" onClick={() => setReload((value) => value + 1)} disabled={!projectId || projectId === "default" || loading} title="Refresh assets" aria-label="Refresh project assets"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/></button>
    </div>
    <div className="wonderplay-browser-body">
      <nav className="wonderplay-browser-folders" aria-label="Project folders">
        <button type="button" aria-pressed={!folder} onClick={() => setFolder("")}><Folder size={13}/> Content</button>
        {folders.map((item) => <button type="button" key={item} aria-pressed={folder === item} onClick={() => setFolder(item)} title={item}><Folder size={13}/><span>{item.split("/").pop()}</span></button>)}
      </nav>
      <div className="wonderplay-browser-assets">
        {!projectId || projectId === "default" ? <p className="wonderplay-browser-message">Start creating, or <Link href="/dashboard/projects">open a project</Link> to see its files.</p> : loading ? <p className="wonderplay-browser-message"><Loader2 size={14} className="animate-spin"/> Loading assets…</p> : error ? <p className="wonderplay-browser-message" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></p> : visible.length === 0 ? <p className="wonderplay-browser-message">{files.length ? "No matching assets." : "No files saved in this project yet."}</p> : visible.map((asset) => {
          const Icon = fileIcon(asset.path);
          const active = selected === asset.path;
          return <div key={asset.path} className="wonderplay-browser-asset" aria-selected={active}>
            <button type="button" onClick={() => setSelected(asset.path)} title={asset.path} aria-pressed={active}><span className="wonderplay-browser-asset-icon"><Icon size={24}/></span><span className="wonderplay-browser-asset-name">{asset.path.split("/").pop()}</span></button>
            {active && <button type="button" className="wonderplay-browser-download" onClick={() => download(asset)} title={`Download ${asset.path}`} aria-label={`Download ${asset.path}`}><Download size={13}/></button>}
          </div>;
        })}
      </div>
    </div>
    <div className="wonderplay-browser-footer"><span>{folder ? `Content / ${folder}` : "Content"}</span><span>{selected || `${files.length} assets`}</span></div>
  </section>;
}
