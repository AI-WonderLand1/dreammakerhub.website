"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { WebContainerManager, TerminalEmulator, type FileNode } from "@wonderspace/ide-engine";
import "@xterm/xterm/css/xterm.css";

const wcManager = new WebContainerManager();

export default function GhostPage({ params }: { params: { ghostId: string } }) {
  const searchParams = useSearchParams();
  const terminalRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const termEmulator = useRef<TerminalEmulator | null>(null);

  const [status, setStatus] = useState<"loading" | "booting" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [ghostName, setGhostName] = useState<string>("");
  const [ghostDescription, setGhostDescription] = useState<string>("");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileCount, setFileCount] = useState(0);

  const openFile = useCallback(async (filePath: string) => {
    if (!wcManager.isReady()) return;
    try {
      const content = await wcManager.readFile(filePath);
      setActiveFile(filePath);
      setFileContent(content);
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  }, []);

  const refreshFileTree = useCallback(async () => {
    if (!wcManager.isReady()) return;
    const tree = await wcManager.getFileTree();
    setFileTree(tree);
  }, []);

  useEffect(() => {
    if (terminalRef.current && !termEmulator.current) {
      termEmulator.current = new TerminalEmulator();
      termEmulator.current.create(terminalRef.current);
    }

    async function loadGhost() {
      try {
        setStatus("loading");

        // Fetch ghost data
        const res = await fetch(`/api/ghost/${params.ghostId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Ghost not found");
        }

        const ghost = await res.json();
        setGhostName(ghost.name || `Ghost ${params.ghostId.slice(0, 8)}`);
        setGhostDescription(ghost.description || "");
        const files = ghost.files || {};
        setFileCount(Object.keys(files).length);

        setStatus("booting");

        // Convert files to FileSystemTree
        const tree: Record<string, any> = {};
        for (const [path, content] of Object.entries(files)) {
          const parts = path.split("/");
          let current = tree;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
              current[parts[i]] = { directory: {} };
            }
            current = current[parts[i]].directory;
          }
          current[parts[parts.length - 1]] = { file: { contents: content } };
        }

        // Boot WebContainer and mount
        await wcManager.boot();
        await wcManager.mountProject(tree);

        wcManager.onServerReady((_port, url) => {
          setPreviewUrl(url);
        });

        if (termEmulator.current) {
          await termEmulator.current.attachShell(async () => {
            return wcManager.spawn("jsh", []);
          });
        }

        await refreshFileTree();

        // Open first file
        const firstFile = Object.keys(files)[0];
        if (firstFile) {
          await openFile(firstFile);
        }

        setStatus("ready");
      } catch (err: any) {
        setError(err.message || "Failed to load ghost");
        setStatus("error");
      }
    }

    loadGhost();

    return () => {
      termEmulator.current?.dispose();
      termEmulator.current = null;
    };
  }, [params.ghostId, refreshFileTree, openFile]);

  const renderFileTree = (nodes: FileNode[], depth = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    for (const node of nodes) {
      if (node.type === "directory") {
        result.push(
          <div key={node.name}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#21262d] rounded cursor-pointer text-sm"
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <span className="text-yellow-400 text-xs">📁</span>
              <span className="text-gray-300">{node.name}</span>
            </div>
            {node.children && renderFileTree(node.children, depth + 1)}
          </div>
        );
      } else {
        result.push(
          <div
            key={node.name}
            onClick={() => openFile(node.name)}
            className={`flex items-center gap-2 px-3 py-1.5 hover:bg-[#21262d] rounded cursor-pointer text-sm ${
              activeFile === node.name ? "bg-blue-500/10 text-blue-400" : "text-gray-400"
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <span className="text-xs">
              {node.name.endsWith(".js") ? "📄" : node.name.endsWith(".json") ? "📋" : node.name.endsWith(".html") ? "🌐" : "📄"}
            </span>
            <span>{node.name}</span>
          </div>
        );
      }
    }
    return result;
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-500 hover:text-white text-sm">← Dashboard</a>
          <div className="h-4 w-px bg-[#30363d]" />
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Time-Travel Ghost
          </span>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
            {ghostName}
          </span>
          {status === "ready" && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">READY</span>
          )}
          {status === "booting" && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded animate-pulse">
              BOOTING...
            </span>
          )}
          {status === "loading" && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded animate-pulse">
              LOADING...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{fileCount} files</span>
          <span>•</span>
          <span>Ghost ID: {params.ghostId.slice(0, 8)}...</span>
        </div>
      </header>

      {status === "error" ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg font-bold mb-2">Ghost Not Found</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <a href="/dashboard" className="mt-4 inline-block text-purple-400 hover:text-purple-300 text-sm">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree */}
          <aside className="w-56 border-r border-[#30363d] bg-[#161b22] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#30363d]">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Files</span>
              {ghostDescription && (
                <p className="text-[10px] text-gray-600 mt-1 truncate">{ghostDescription}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-1 text-sm">
              {status === "ready" ? renderFileTree(fileTree) : (
                <div className="p-3 text-xs text-gray-500 animate-pulse">Loading files...</div>
              )}
            </div>
          </aside>

          {/* Editor + Terminal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab */}
            <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center px-2 gap-1 shrink-0">
              {activeFile && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#0d1117] border border-[#30363d] rounded-t text-xs">
                  <span className="text-gray-400">{activeFile}</span>
                  <button
                    onClick={() => setActiveFile("")}
                    className="text-gray-600 hover:text-white ml-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Code Editor */}
            <div className="flex-1 relative overflow-hidden">
              {activeFile ? (
                <textarea
                  value={fileContent}
                  readOnly
                  className="w-full h-full bg-[#0d1117] text-[#c9d1d9] p-4 font-mono text-sm resize-none focus:outline-none border-none"
                  style={{ tabSize: 2 }}
                  spellCheck={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  Select a file to view
                </div>
              )}
            </div>

            {/* Terminal */}
            <div className="h-56 border-t border-[#30363d] bg-[#0d1117] flex flex-col shrink-0">
              <div className="h-8 bg-[#161b22] border-b border-[#30363d] flex items-center px-3 shrink-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Terminal</span>
              </div>
              <div ref={terminalRef} className="flex-1 p-1 overflow-hidden" />
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <aside className="w-96 border-l border-[#30363d] bg-[#161b22] flex flex-col shrink-0">
              <div className="h-8 border-b border-[#30363d] flex items-center px-3 shrink-0">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview</span>
                <button
                  onClick={() => {
                    if (previewRef.current) previewRef.current.src = previewUrl;
                  }}
                  className="ml-auto text-gray-500 hover:text-white text-xs"
                >
                  ↻
                </button>
              </div>
              <iframe
                ref={previewRef}
                src={previewUrl}
                className="flex-1 w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
                title="Preview"
              />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
