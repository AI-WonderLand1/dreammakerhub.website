"use client";

import { Puck } from "@puckeditor/core";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Monitor, Code, Clock, Download, Sparkles, Box } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchExternalAssets, downloadAssetToStorage, type ExternalAsset } from "@/lib/ai/assetLibrary";
import { useAuth } from "@/lib/supabase/auth-context";
import "@puckeditor/core/puck.css";
import "@/styles/puck-dark-fix.css";
import { config } from "./puck.config";
import { retrievePuckData } from "@/lib/ai-to-puck";
import { useAutoSave } from "@/components/VersionHistory";
import { TempStorageWarning } from "@/components/TempStorageWarning";
import { PuckAIPanel } from "@/components/PuckAIPanel";
import { VersionHistory } from "@/components/VersionHistory";
import { PuckPreview } from "./PuckPreview";

// Export generation functions
function generateHTMLExport(data: InitialData): string {
  const content = data.content || [];
  const htmlContent = content.map(item => {
    if (item.type === 'Heading') {
      return `<h1>${item.props?.content || 'Heading'}</h1>`;
    }
    if (item.type === 'Paragraph') {
      return `<p>${item.props?.content || 'Paragraph'}</p>`;
    }
    return `<div>${item.type}</div>`;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>Puck Export</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}

function generateReactExport(data: InitialData): string {
  const content = data.content || [];
  const reactComponents = content.map(item => {
    if (item.type === 'Heading') {
      return `  <h1>${item.props?.content || 'Heading'}</h1>`;
    }
    if (item.type === 'Paragraph') {
      return `  <p>${item.props?.content || 'Paragraph'}</p>`;
    }
    return `  <div>${item.type}</div>`;
  }).join('\n');
  
  return `import React from 'react';

export default function App() {
  return (
    <div>
${reactComponents}
    </div>
  );
}`;
}

// PuckAIButton component
interface PuckAIButtonProps {
  onClick: () => void;
}

function PuckAIButton({ onClick }: PuckAIButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg"
    >
      <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
        <span className="w-2 h-2 bg-white rounded-full"></span>
      </span>
      AI Assistant
    </button>
  );
}

// TempStorageBadge component
interface TempStorageBadgeProps {
  hoursRemaining?: number;
}

function TempStorageBadge({ hoursRemaining = 24 }: TempStorageBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-medium text-amber-300">
      <Clock className="w-3 h-3" />
      <span>{hoursRemaining}h left</span>
    </div>
  );
}

// ExportModal component
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "html" | "json" | "react") => void;
}

function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a0a10] border border-white/20 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Export Project</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="w-5 h-5 text-white/40">×</span>
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => onExport("html")}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold">HTML</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">HTML Export</p>
                <p className="text-xs text-white/60">Static HTML file</p>
              </div>
            </button>
            
            <button
              onClick={() => onExport("react")}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 font-bold">JSX</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">React Export</p>
                <p className="text-xs text-white/60">React component</p>
              </div>
            </button>
            
            <button
              onClick={() => onExport("json")}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 font-bold">JSON</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">JSON Export</p>
                <p className="text-xs text-white/60">Project data</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type EditorStatus = "loading" | "loaded" | "empty" | "error" | "saving" | "saved";

type InitialData = {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root: { type: string; props: Record<string, unknown> };
};

interface PuckEditorClientProps {
  initialData: InitialData | null;
  projectId?: string;
  readOnly?: boolean;
  showAIPanel?: boolean;
}

function LayoutWrapper() {
  return <Puck.Layout />;
}

export function PuckEditorClient({ 
  initialData, 
  projectId,
  readOnly = false,
  showAIPanel = true,
}: PuckEditorClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [data, setData] = useState<InitialData | null>(initialData);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [localProjectId, setLocalProjectId] = useState<string | undefined>(projectId);
  const [showAI, setShowAI] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTempWarning, setShowTempWarning] = useState(false);
  const [showAssetLib, setShowAssetLib] = useState(false);
  const [assets, setAssets] = useState<ExternalAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetSearching, setAssetSearching] = useState(false);
  const [importingAsset, setImportingAsset] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "preview" | "code">("visual");
  const [storageInfo, setStorageInfo] = useState<{type: string; hoursRemaining?: number; expiresAt?: string}>({type: "platform"});
  const searchParams = useSearchParams();

  const hasContent = (data?.content?.length ?? 0) > 0;

  // Auto-save version history
  const { lastSaved, saving: autoSaving } = useAutoSave(localProjectId || null, data, 60000);

  const handleApplyAIData = useCallback((newData: InitialData) => {
    setData(newData);
    setStatus("loaded");
    setShowAI(false);
  }, []);

  const handleExport = useCallback((format: "html" | "json" | "react") => {
    if (!data) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case "html":
        content = generateHTMLExport(data);
        filename = "index.html";
        mimeType = "text/html";
        break;
      case "react":
        content = generateReactExport(data);
        filename = "App.jsx";
        mimeType = "text/javascript";
        break;
      case "json":
      default:
        content = JSON.stringify(data, null, 2);
        filename = "puck-project.json";
        mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [data]);

  const handleSearchAssets = useCallback(async () => {
    setAssetSearching(true);
    try {
      const results = await searchExternalAssets({ query: assetSearch || "3d model", limit: 12 });
      setAssets(results);
    } finally {
      setAssetSearching(false);
    }
  }, [assetSearch]);

  const handleImportAsset = useCallback(async (asset: ExternalAsset) => {
    if (!user) return;
    setImportingAsset(asset.id);
    try {
      const result = await downloadAssetToStorage(asset, user.id);
      if (result.success && result.localUrl) {
        setData(prev => prev ? {
          ...prev,
          content: [...prev.content, {
            type: "ThreeCanvasWrapperBlock",
            props: { label: asset.name, height: "md", sceneType: "3d-world", showControls: true, modelUrl: result.localUrl }
          }]
        } : prev);
      }
    } finally {
      setImportingAsset(null);
    }
  }, [user]);

  useEffect(() => {
    // Check for AI-generated data from session storage
    const aiDataKey = searchParams?.get("ai_data");
    if (aiDataKey) {
      const aiData = retrievePuckData(aiDataKey);
      if (aiData) {
        setStatus("loaded");
        setData({
          content: aiData.content,
          root: aiData.root || { type: "Fragment", props: {} }
        });
        return;
      }
    }

    // Otherwise, use initialnData or load project
    if (initialData?.content?.length) {
      setStatus("loaded");
      setData(initialData);
    } else if (projectId) {
      loadProject(projectId);
    } else {
      setStatus("empty");
    }
  }, [initialData, projectId, searchParams]);

  const loadProject = async (pid: string) => {
    setStatus("loading");
    setSaveStatus("Loading...");

    try {
      const res = await fetch(`/api/puck/save?projectId=${pid}`);
      const json = await res.json();

      if (json.ok && json.project) {
        setData(json.project.content);
        setLocalProjectId(pid);
        setStatus("loaded");
        
        if (json.storageInfo) {
          setStorageInfo(json.storageInfo);
          if (json.storageInfo.type === 'temp' && 
              json.storageInfo.hoursRemaining !== null && 
              json.storageInfo.hoursRemaining < 24) {
            setShowTempWarning(true);
          }
        }
      } else {
        setStatus("empty");
      }
    } catch (error) {
      console.error("[Puck] Load failed:", error);
      setStatus("error");
    }
    setSaveStatus("");
  };

  const handlePublish = useCallback(async (publishData: unknown) => {
    if (readOnly) {
      setSaveStatus("Read-only mode");
      return;
    }

    const pid = localProjectId || `puck-${Date.now()}`;
    setStatus("saving");
    setSaveStatus("Saving...");

    try {
      const res = await fetch("/api/puck/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: pid,
          content: publishData,
        }),
      });

      const json = await res.json();

      if (json.ok) {
        setLocalProjectId(pid);
        setSaveStatus("Saved!");
      } else {
        setSaveStatus(`Error: ${json.error}`);
      }
    } catch (error) {
      console.error("[Puck] Save failed:", error);
      setSaveStatus("Save failed");
    }

    setStatus("loaded");
    setTimeout(() => setSaveStatus(""), 3000);
  }, [localProjectId, readOnly]);

  const handleDataChange = useCallback((newData: any) => {
    setData({
      content: newData.content || [],
      root: newData.root || { type: "Fragment", props: {} },
    });
  }, []);

  const shellClassName = useMemo(
    () => "h-[80vh] w-full overflow-hidden rounded-lg border border-white/10",
    [],
  );

  const handleSaveToPlatform = useCallback(async () => {
    if (!localProjectId) return;
    
    try {
      const res = await fetch("/api/puck/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: localProjectId,
          storageType: "platform",
        }),
      });
      
      const json = await res.json();
      if (json.ok) {
        setStorageInfo({ type: "platform", hoursRemaining: undefined, expiresAt: undefined });
        setShowTempWarning(false);
        setSaveStatus("Saved to platform!");
      }
    } catch (error) {
      console.error("[Puck] Save to platform failed:", error);
    }
  }, [localProjectId]);

  const handleConnectCloud = useCallback(() => {
    window.location.href = "/dashboard/settings/cloud";
  }, []);

  return (
    <div className="relative">
      {showAIPanel && (
        <div className="absolute top-2 left-2 z-40 flex items-center gap-2">
          <PuckAIButton onClick={() => setShowAI(!showAI)} />
        </div>
      )}

      {showAIPanel && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-black/60 backdrop-blur rounded-lg p-1">
          <button
            onClick={() => setEditorMode("visual")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              editorMode === "visual" 
                ? "bg-violet-600 text-white" 
                : "text-white/60 hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => setEditorMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              editorMode === "preview" 
                ? "bg-violet-600 text-white" 
                : "text-white/60 hover:text-white"
            }`}
          >
            <Monitor className="w-3 h-3" />
            Preview
          </button>
          <button
            onClick={() => setEditorMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
              editorMode === "code" 
                ? "bg-violet-600 text-white" 
                : "text-white/60 hover:text-white"
            }`}
          >
            <Code className="w-3 h-3" />
            Code
          </button>
        </div>
      )}

      {showAIPanel && (
        <div className="absolute top-2 right-2 z-40 flex items-center gap-2">
          {storageInfo?.type === 'temp' && storageInfo.hoursRemaining !== null && (
            <TempStorageBadge hoursRemaining={storageInfo.hoursRemaining} />
          )}
          {localProjectId && (
            <VersionHistory
              projectId={localProjectId}
              onRestore={(content) => {
                setData(content);
                setStatus("loaded");
              }}
            />
          )}
          {lastSaved && (
            <span className="text-[10px] text-white/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {autoSaving && (
            <span className="text-[10px] text-white/30 animate-pulse">Saving...</span>
          )}
          <button
            onClick={() => setShowAssetLib(!showAssetLib)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/50 hover:bg-violet-600 rounded-lg text-xs font-medium text-white/80 transition-colors"
          >
            <Box className="w-3 h-3" />
            3D
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white/80 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      )}

      {saveStatus && (
        <div className="absolute top-2 right-44 z-50 rounded-md bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur">
          {saveStatus}
        </div>
      )}

      {showAssetLib && (
        <div className="absolute left-2 top-14 z-50 w-96 rounded-lg border border-white/10 bg-[#1a1a2e] p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchAssets(); }}
              placeholder="Search 3D assets..."
              className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30"
            />
            <button
              onClick={handleSearchAssets}
              disabled={assetSearching}
              className="rounded bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500 disabled:opacity-40"
            >
              {assetSearching ? "..." : "Search"}
            </button>
          </div>
          {assets.length > 0 && (
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleImportAsset(asset)}
                  disabled={importingAsset === asset.id}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-2 hover:border-violet-500/50 disabled:opacity-40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-lg">
                    🎨
                  </div>
                  <span className="max-w-16 truncate text-[10px] text-white/60">{asset.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {status === "loading" && (
        <div className={shellClassName}>
          <div className="flex h-full animate-pulse items-center justify-center text-sm text-white/80">
            Loading editor...
          </div>
        </div>
      )}
      
      {status === "empty" && (
        <div className={shellClassName}>
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-12 h-12 text-violet-400/50" />
              <p className="text-lg font-semibold text-white">Start building your page</p>
              <p className="text-sm text-white/60 max-w-md">
                Use the AI Builder to generate a layout, or drag and drop blocks from the sidebar.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAI(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Build with AI
              </button>
              <button
                type="button"
                onClick={() => {
                  setData({ content: [], root: { type: "Fragment", props: {} } });
                  setStatus("loaded");
                }}
                className="rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                Start Blank
              </button>
            </div>
          </div>
        </div>
      )}
      
      {status === "error" && (
        <div className={shellClassName}>
          <div className="p-4 text-sm text-red-300">Failed to load editor content.</div>
        </div>
      )}
      
      {status !== "loading" && (hasContent || status === "loaded") && (
        <>
          {editorMode === "visual" && (
            <Puck
              config={config}
              data={data ?? { content: [] }}
              onPublish={handlePublish}
              onChange={handleDataChange}
               iframe={{
                 enabled: false,
               }}
            >
              <LayoutWrapper />
            </Puck>
          )}
          
          {editorMode === "preview" && (
            <div className={shellClassName}>
              <PuckPreview data={data || { content: [] }} />
            </div>
          )}
          
          {editorMode === "code" && (
            <div className={shellClassName}>
              <pre className="p-4 text-xs text-white/70 overflow-auto h-full font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {showAIPanel && (
        <PuckAIPanel
          currentData={data}
          onApplyData={handleApplyAIData}
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />
      )}

      {showTempWarning && (
        <TempStorageWarning
          isOpen={showTempWarning}
          onClose={() => setShowTempWarning(false)}
          onSaveToPlatform={handleSaveToPlatform}
          onConnectCloud={handleConnectCloud}
          onExport={() => setShowExportModal(true)}
          hoursRemaining={storageInfo?.hoursRemaining || 24}
        />
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="glass rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Export Project</h3>
            <p className="text-sm text-white/60 mb-6">Choose how you want to export your project:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExport("html")}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📄</span>
                </div>
                <div>
                  <p className="font-medium text-white">Static HTML</p>
                  <p className="text-xs text-white/50">Plain HTML, CSS, JS files</p>
                </div>
              </button>
              
              <button
                onClick={() => handleExport("react")}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚛️</span>
                </div>
                <div>
                  <p className="font-medium text-white">React Component</p>
                  <p className="text-xs text-white/50">JSX with Tailwind classes</p>
                </div>
              </button>
              
              <button
                onClick={() => handleExport("json")}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">{ }</span>
                </div>
                <div>
                  <p className="font-medium text-white">Puck JSON</p>
                  <p className="text-xs text-white/50">Raw Puck data format</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  router.push("/wonder-build/playcanvas");
                }}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎮</span>
                </div>
                <div>
                  <p className="font-medium text-white">PlayCanvas Scene</p>
                  <p className="text-xs text-white/50">Open in 3D scene editor</p>
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}