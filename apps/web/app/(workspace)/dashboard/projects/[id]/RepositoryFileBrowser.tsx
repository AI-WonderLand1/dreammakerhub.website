"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";

type RepoEntry = {
  name: string;
  path: string;
  kind: "folder" | "file";
  count?: number;
  size?: number;
};

const encoder = new TextEncoder();

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

export default function RepositoryFileBrowser({
  projectId,
  files,
  updatedLabel,
}: {
  projectId: string;
  files: Record<string, string>;
  updatedLabel?: string;
}) {
  const [currentPath, setCurrentPath] = useState("");
  const entries = useMemo(() => entriesAtPath(files, currentPath), [files, currentPath]);
  const readme = useMemo(() => readmeAtPath(files, currentPath), [files, currentPath]);
  const breadcrumbs = currentPath ? currentPath.split("/") : [];
  const totalFiles = Object.keys(files).length;

  const openBreadcrumb = (index: number) => {
    setCurrentPath(breadcrumbs.slice(0, index + 1).join("/"));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1625]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-1 text-sm">
          <button type="button" onClick={() => setCurrentPath("")} className="font-semibold text-white hover:text-blue-300">Files</button>
          {breadcrumbs.map((part, index) => (
            <Fragment key={`${part}-${index}`}>
              <ChevronRight size={14} className="shrink-0 text-white/25" />
              <button type="button" onClick={() => openBreadcrumb(index)} className="max-w-40 truncate text-white/65 hover:text-white">{part}</button>
            </Fragment>
          ))}
        </div>
        <Link href={`/dashboard/projects/${projectId}/files`} className="text-xs text-blue-400 hover:underline">Open full file manager →</Link>
      </div>

      <div className="border-b border-white/10 bg-white/[.02] px-4 py-2.5 text-xs text-white/40">
        <span>{totalFiles} stored file{totalFiles === 1 ? "" : "s"}</span>
        {updatedLabel && <span className="ml-3">Last saved {updatedLabel}</span>}
      </div>

      <div className="divide-y divide-white/[.07]">
        {currentPath && (
          <button
            type="button"
            onClick={() => setCurrentPath(currentPath.split("/").slice(0, -1).join("/"))}
            className="grid w-full grid-cols-[minmax(0,1fr)_110px] items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/[.035]"
          >
            <span className="flex min-w-0 items-center gap-2 text-white/65"><FolderOpen size={16} className="text-blue-400" />..</span>
            <span className="text-right text-xs text-white/30">Parent folder</span>
          </button>
        )}

        {entries.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/35">No files in this folder.</div>
        ) : entries.map((entry) => {
          if (entry.kind === "folder") {
            return (
              <button
                type="button"
                key={`folder-${entry.path}`}
                onClick={() => setCurrentPath(entry.path)}
                className="grid w-full grid-cols-[minmax(0,1fr)_110px] items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/[.035]"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-white/80"><Folder size={16} className="shrink-0 fill-blue-500/20 text-blue-400" /><span className="truncate">{entry.name}</span></span>
                <span className="text-right text-xs text-white/35">{entry.count} file{entry.count === 1 ? "" : "s"}</span>
              </button>
            );
          }

          const isReadme = /^readme\.(md|mdx)$/i.test(entry.name);
          return (
            <Link
              key={`file-${entry.path}`}
              href={`/dashboard/projects/${projectId}/files?path=${encodeURIComponent(entry.path)}`}
              className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[.035]"
            >
              <span className="flex min-w-0 items-center gap-2 text-white/70">
                {isReadme ? <FileText size={16} className="shrink-0 text-white/45" /> : <FileCode2 size={16} className="shrink-0 text-white/45" />}
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="text-right text-xs text-white/35">{formatBytes(entry.size || 0)}</span>
            </Link>
          );
        })}
      </div>

      {readme && (
        <div className="border-t border-white/10">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[.02] px-4 py-3 text-sm font-semibold">
            <FileText size={16} className="text-white/50" />
            {readme.name}
          </div>
          <article className="px-5 py-5 sm:px-7 sm:py-6">
            {readme.content.trim() ? renderMarkdown(readme.content) : <p className="text-sm text-white/35">This README is empty.</p>}
          </article>
        </div>
      )}
    </section>
  );
}
