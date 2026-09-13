"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronRight,
  Download,
  FileCode2,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { CodeEditor } from "@/components/file-manager/CodeEditor";
import { ImportModal } from "@/components/file-manager/ImportModal";
import { broadcastFileEvent } from "@/lib/realtime/events";

type RepoEntry = {
  name: string;
  path: string;
  kind: "folder" | "file";
  count?: number;
  size?: number;
};

type RepositoryFileBrowserProps = {
  projectId: string;
  projectType?: string | null;
  files: Record<string, string>;
  updatedLabel?: string;
  initialPath?: string | null;
  onFilesChange?: (files: Record<string, string>) => void;
};

const encoder = new TextEncoder();

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function fileContextLabel(projectType?: string | null) {
  const type = (projectType || "").toLowerCase();
  if (["game", "3d", "3d_scene", "playcanvas"].includes(type)) return "3D project files";
  if (["workspace", "code"].includes(type)) return "Code project files";
  if (type === "npc") return "NPC AI project files";
  if (["ai", "ai_app", "ai-playground", "ai_playground"].includes(type)) return "AI project files";
  return "Website project files";
}

function entriesAtPath(files: Record<string, string>, currentPath: string): RepoEntry[] {
  const prefix = currentPath ? `${currentPath}/` : "";
  const folders = new Map<string, number>();
  const directFiles: RepoEntry[] = [];

  for (const [rawPath, content] of Object.entries(files)) {
    const path = rawPath.replace(/^\/+/, "");
    if (!path.startsWith(prefix)) continue;

    const relative = path.slice(prefix.length);
    if (!relative) continue;

    const [name, ...rest] = relative.split("/");
    if (rest.length > 0) {
      folders.set(name, (folders.get(name) || 0) + 1);
      continue;
    }

    directFiles.push({
      name,
      path,
      kind: "file",
      size: encoder.encode(content || "").byteLength,
    });
  }

  return [
    ...Array.from(folders.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({
        name,
        path: prefix ? `${prefix}${name}` : name,
        kind: "folder" as const,
        count,
      })),
    ...directFiles.sort((a, b) => a.name.localeCompare(b.name)),
  ];
}

function readmeAtPath(files: Record<string, string>, currentPath: string) {
  const prefix = currentPath ? `${currentPath}/` : "";
  const candidates = ["README.md", "Readme.md", "readme.md", "README.mdx", "readme.mdx"];
  for (const name of candidates) {
    const path = `${prefix}${name}`;
    if (Object.prototype.hasOwnProperty.call(files, path)) {
      return { path, name, content: files[path] || "" };
    }
  }
  return null;
}

function safeHref(raw: string) {
  const value = raw.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/") || value.startsWith("#") || value.startsWith("./") || value.startsWith("../")) return value;
  return "#";
}

function renderInline(text: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(<strong key={`strong-${key++}`} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={`code-${key++}`} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.92em] text-fuchsia-200">{token.slice(1, -1)}</code>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = safeHref(linkMatch[2]);
        nodes.push(
          <a
            key={`link-${key++}`}
            href={href}
            target={/^https?:\/\//i.test(href) ? "_blank" : undefined}
            rel={/^https?:\/\//i.test(href) ? "noreferrer" : undefined}
            className="text-blue-400 hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const isSpecial = (line: string) =>
    /^```/.test(line) ||
    /^#{1,6}\s+/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*(---+|___+|\*\*\*+)\s*$/.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const language = line.replace(/^```/, "").trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      output.push(
        <div key={`codeblock-${key++}`} className="my-4 overflow-hidden rounded-lg border border-white/10 bg-[#07101b]">
          {language && <div className="border-b border-white/10 px-4 py-2 text-[10px] uppercase tracking-wider text-white/35">{language}</div>}
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-white/75"><code>{codeLines.join("\n")}</code></pre>
        </div>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const classes = [
        "mt-7 border-b border-white/10 pb-2 text-2xl font-bold",
        "mt-6 border-b border-white/10 pb-2 text-xl font-bold",
        "mt-5 text-lg font-bold",
        "mt-4 text-base font-semibold",
        "mt-4 text-sm font-semibold",
        "mt-3 text-sm font-semibold text-white/80",
      ];
      output.push(<div key={`heading-${key++}`} className={classes[level - 1]}>{renderInline(heading[2])}</div>);
      i += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      output.push(
        <ul key={`ul-${key++}`} className="my-3 list-disc space-y-1 pl-6 text-sm leading-6 text-white/70">
          {items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      output.push(
        <ol key={`ol-${key++}`} className="my-3 list-decimal space-y-1 pl-6 text-sm leading-6 text-white/70">
          {items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
        </ol>,
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      output.push(
        <blockquote key={`quote-${key++}`} className="my-4 border-l-4 border-violet-500/50 pl-4 text-sm italic leading-6 text-white/55">
          {renderInline(quote.join(" "))}
        </blockquote>,
      );
      continue;
    }

    if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) {
      output.push(<hr key={`hr-${key++}`} className="my-6 border-white/10" />);
      i += 1;
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    output.push(
      <p key={`p-${key++}`} className="my-3 text-sm leading-7 text-white/70">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
  }

  return output;
}

function cleanEntryName(raw: string) {
  const value = raw.trim().replace(/^\/+|\/+$/g, "");
  if (!value || value === "." || value === ".." || value.includes("/")) return null;
  return value;
}

export default function RepositoryFileBrowser({
  projectId,
  projectType,
  files,
  updatedLabel,
  initialPath,
  onFilesChange,
}: RepositoryFileBrowserProps) {
  const [managedFiles, setManagedFiles] = useState<Record<string, string>>(files);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setManagedFiles(files);
    if (selectedPath && Object.prototype.hasOwnProperty.call(files, selectedPath)) {
      setFileContent(files[selectedPath] || "");
    }
  }, [files, selectedPath]);

  useEffect(() => {
    if (!initialPath) return;
    const normalized = initialPath.replace(/^\/+/, "");
    if (Object.prototype.hasOwnProperty.call(managedFiles, normalized)) {
      const parent = normalized.split("/").slice(0, -1).join("/");
      setCurrentPath(parent);
      setSelectedPath(normalized);
      setFileContent(managedFiles[normalized] || "");
      return;
    }
    if (Object.keys(managedFiles).some((path) => path.startsWith(`${normalized}/`))) {
      setCurrentPath(normalized);
    }
  }, [initialPath, managedFiles]);

  const entries = useMemo(() => entriesAtPath(managedFiles, currentPath), [managedFiles, currentPath]);
  const readme = useMemo(() => readmeAtPath(managedFiles, currentPath), [managedFiles, currentPath]);
  const breadcrumbs = currentPath ? currentPath.split("/") : [];
  const totalFiles = Object.keys(managedFiles).length;

  const applyFiles = (nextFiles: Record<string, string>) => {
    setManagedFiles(nextFiles);
    onFilesChange?.(nextFiles);
  };

  const openBreadcrumb = (index: number) => {
    setSelectedPath(null);
    setCurrentPath(breadcrumbs.slice(0, index + 1).join("/"));
  };

  const checkResponse = async (response: Response, fallback: string) => {
    if (response.ok) return;
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || fallback);
  };

  const createFile = async () => {
    const rawName = window.prompt("File name:");
    if (!rawName) return;
    const name = cleanEntryName(rawName);
    if (!name) {
      setActionError("Use a file name without / or ..");
      return;
    }
    const path = currentPath ? `${currentPath}/${name}` : name;
    if (Object.prototype.hasOwnProperty.call(managedFiles, path)) {
      setActionError(`${path} already exists`);
      return;
    }

    try {
      setActionError(null);
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: { [path]: "" } }),
      });
      await checkResponse(response, "Failed to create file");
      const next = { ...managedFiles, [path]: "" };
      applyFiles(next);
      setSelectedPath(path);
      setFileContent("");
      broadcastFileEvent(projectId, { type: "file:create", message: `created ${path}` });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create file");
    }
  };

  const createFolder = async () => {
    const rawName = window.prompt("Folder name:");
    if (!rawName) return;
    const name = cleanEntryName(rawName);
    if (!name) {
      setActionError("Use a folder name without / or ..");
      return;
    }
    const folderPath = currentPath ? `${currentPath}/${name}` : name;
    const placeholder = `${folderPath}/.gitkeep`;

    try {
      setActionError(null);
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: { [placeholder]: "" } }),
      });
      await checkResponse(response, "Failed to create folder");
      applyFiles({ ...managedFiles, [placeholder]: "" });
      broadcastFileEvent(projectId, { type: "file:create", message: `created folder ${folderPath}` });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create folder");
    }
  };

  const renameEntry = async (entry: RepoEntry) => {
    const rawName = window.prompt(`Rename ${entry.name} to:`, entry.name);
    if (!rawName || rawName === entry.name) return;
    const name = cleanEntryName(rawName);
    if (!name) {
      setActionError("Use a name without / or ..");
      return;
    }
    const parent = entry.path.split("/").slice(0, -1).join("/");
    const newPath = parent ? `${parent}/${name}` : name;

    try {
      setActionError(null);
      const response = await fetch(`/api/projects/${projectId}/files/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPath: entry.path, newPath }),
      });
      await checkResponse(response, "Failed to rename");

      const next: Record<string, string> = {};
      for (const [path, content] of Object.entries(managedFiles)) {
        if (path === entry.path || path.startsWith(`${entry.path}/`)) {
          next[`${newPath}${path.slice(entry.path.length)}`] = content;
        } else {
          next[path] = content;
        }
      }
      applyFiles(next);
      if (selectedPath === entry.path || selectedPath?.startsWith(`${entry.path}/`)) {
        setSelectedPath(`${newPath}${(selectedPath || "").slice(entry.path.length)}`);
      }
      broadcastFileEvent(projectId, { type: "file:rename", message: `renamed ${entry.path} → ${newPath}` });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to rename");
    }
  };

  const deleteEntry = async (entry: RepoEntry) => {
    if (!window.confirm(`Delete ${entry.path}${entry.kind === "folder" ? " and everything inside it" : ""}?`)) return;

    try {
      setActionError(null);
      const response = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(entry.path)}`, {
        method: "DELETE",
      });
      await checkResponse(response, "Failed to delete");

      const next: Record<string, string> = {};
      for (const [path, content] of Object.entries(managedFiles)) {
        if (path === entry.path || path.startsWith(`${entry.path}/`)) continue;
        next[path] = content;
      }
      applyFiles(next);
      if (selectedPath === entry.path || selectedPath?.startsWith(`${entry.path}/`)) {
        setSelectedPath(null);
        setFileContent("");
      }
      broadcastFileEvent(projectId, { type: "file:delete", message: `deleted ${entry.path}` });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const selectFile = (path: string) => {
    setSelectedPath(path);
    setFileContent(managedFiles[path] || "");
  };

  const saveSelectedFile = async () => {
    if (!selectedPath || saving) return;
    setSaving(true);
    try {
      setActionError(null);
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: { [selectedPath]: fileContent } }),
      });
      await checkResponse(response, "Failed to save file");
      applyFiles({ ...managedFiles, [selectedPath]: fileContent });
      broadcastFileEvent(projectId, { type: "file:save", message: `saved ${selectedPath}` });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const importFiles = async (imported: Record<string, string>) => {
    try {
      setActionError(null);
      const response = await fetch(`/api/projects/${projectId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: imported }),
      });
      await checkResponse(response, "Import failed");
      applyFiles({ ...managedFiles, ...imported });
      broadcastFileEvent(projectId, {
        type: "file:import",
        message: `imported ${Object.keys(imported).length} file${Object.keys(imported).length === 1 ? "" : "s"}`,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Import failed");
    }
  };

  return (
    <section id="files" className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1625]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1 text-sm">
            <button type="button" onClick={() => { setCurrentPath(""); setSelectedPath(null); }} className="font-semibold text-white hover:text-blue-300">Files</button>
            {breadcrumbs.map((part, index) => (
              <Fragment key={`${part}-${index}`}>
                <ChevronRight size={14} className="shrink-0 text-white/25" />
                <button type="button" onClick={() => openBreadcrumb(index)} className="max-w-40 truncate text-white/65 hover:text-white">{part}</button>
              </Fragment>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-white/35">{fileContextLabel(projectType)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => void createFile()} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5"><FilePlus2 size={14}/> New file</button>
          <button type="button" onClick={() => void createFolder()} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5"><FolderPlus size={14}/> New folder</button>
          <button type="button" onClick={() => setImportOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5"><Upload size={14}/> Import</button>
          <button type="button" onClick={() => { window.location.href = `/api/projects/${projectId}/export?format=zip`; }} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5"><Download size={14}/> ZIP</button>
          {selectedPath && (
            <button type="button" disabled={saving} onClick={() => void saveSelectedFile()} className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"><Save size={14}/>{saving ? "Saving..." : "Save"}</button>
          )}
        </div>
      </div>

      <div className="border-b border-white/10 bg-white/[.02] px-4 py-2.5 text-xs text-white/40">
        <span>{totalFiles} stored file{totalFiles === 1 ? "" : "s"}</span>
        {updatedLabel && <span className="ml-3">Last saved {updatedLabel}</span>}
        <span className="ml-3 text-white/25">Create, rename, delete, import, and edit here.</span>
      </div>

      {actionError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{actionError}</div>
      )}

      <div className="divide-y divide-white/[.07]">
        {currentPath && (
          <button
            type="button"
            onClick={() => { setSelectedPath(null); setCurrentPath(currentPath.split("/").slice(0, -1).join("/")); }}
            className="grid w-full grid-cols-[minmax(0,1fr)_110px] items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/[.035]"
          >
            <span className="flex min-w-0 items-center gap-2 text-white/65"><FolderOpen size={16} className="text-blue-400" />..</span>
            <span className="text-right text-xs text-white/30">Parent folder</span>
          </button>
        )}

        {entries.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/35">
            <p>No files in this folder.</p>
            <div className="mt-3 flex justify-center gap-2">
              <button type="button" onClick={() => void createFile()} className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">Create file</button>
              <button type="button" onClick={() => void createFolder()} className="rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5">Create folder</button>
            </div>
          </div>
        ) : entries.map((entry) => {
          const isReadme = entry.kind === "file" && /^readme\.(md|mdx)$/i.test(entry.name);
          return (
            <div key={`${entry.kind}-${entry.path}`} className="grid grid-cols-[minmax(0,1fr)_100px_auto] items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/[.035]">
              {entry.kind === "folder" ? (
                <button type="button" onClick={() => { setSelectedPath(null); setCurrentPath(entry.path); }} className="flex min-w-0 items-center gap-2 px-1 py-1 text-left font-medium text-white/80">
                  <Folder size={16} className="shrink-0 fill-blue-500/20 text-blue-400" />
                  <span className="truncate">{entry.name}</span>
                </button>
              ) : (
                <button type="button" onClick={() => selectFile(entry.path)} className={`flex min-w-0 items-center gap-2 rounded px-1 py-1 text-left ${selectedPath === entry.path ? "text-violet-300" : "text-white/70"}`}>
                  {isReadme ? <FileText size={16} className="shrink-0 text-white/45" /> : <FileCode2 size={16} className="shrink-0 text-white/45" />}
                  <span className="truncate">{entry.name}</span>
                </button>
              )}
              <span className="text-right text-xs text-white/35">{entry.kind === "folder" ? `${entry.count} file${entry.count === 1 ? "" : "s"}` : formatBytes(entry.size || 0)}</span>
              <div className="flex justify-end gap-1">
                <button type="button" onClick={() => void renameEntry(entry)} className="rounded p-1.5 text-white/35 hover:bg-white/10 hover:text-white" aria-label={`Rename ${entry.name}`} title="Rename"><Pencil size={13}/></button>
                <button type="button" onClick={() => void deleteEntry(entry)} className="rounded p-1.5 text-white/35 hover:bg-red-500/10 hover:text-red-300" aria-label={`Delete ${entry.name}`} title="Delete"><Trash2 size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPath ? (
        <div className="h-[430px] border-t border-white/10 bg-[#1e1e1e]">
          <CodeEditor
            filePath={selectedPath}
            content={fileContent}
            onChange={setFileContent}
            onSave={() => void saveSelectedFile()}
          />
        </div>
      ) : readme ? (
        <div className="border-t border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[.02] px-4 py-3 text-sm font-semibold">
            <span className="flex items-center gap-2"><FileText size={16} className="text-white/50" />{readme.name}</span>
            <button type="button" onClick={() => selectFile(readme.path)} className="text-xs font-normal text-blue-400 hover:underline">Edit README</button>
          </div>
          <article className="px-5 py-5 sm:px-7 sm:py-6">
            {readme.content.trim() ? renderMarkdown(readme.content) : <p className="text-sm text-white/35">This README is empty.</p>}
          </article>
        </div>
      ) : null}

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(imported) => void importFiles(imported)}
      />
    </section>
  );
}
