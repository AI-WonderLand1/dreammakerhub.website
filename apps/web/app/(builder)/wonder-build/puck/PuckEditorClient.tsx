"use client";

import { Puck } from "@puckeditor/core";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import "@puckeditor/core/puck.css";
import { config } from "./puck.config";
import { retrievePuckData } from "@/lib/ai-to-puck";

type EditorStatus = "loading" | "loaded" | "empty" | "error" | "saving" | "saved";

type InitialData = {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root?: { type: string; props: Record<string, unknown> };
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
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [data, setData] = useState<InitialData | null>(initialData);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [localProjectId, setLocalProjectId] = useState<string | undefined>(projectId);
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

  useEffect(() => {
    // Check for AI-generated data from session storage
    const aiDataKey = searchParams.get("ai_data");
    if (aiDataKey) {
      const aiData = retrievePuckData(aiDataKey);
      if (aiData) {
        setStatus("loaded");
        setData(aiData);
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
        setStorageInfo({ type: "platform", hoursRemaining: null, expiresAt: null });
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
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white/80 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      )}

      {saveStatus && (
        <div className="absolute top-2 right-36 z-50 rounded-md bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur">
          {saveStatus}
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
                  setData({ content: [] });
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
                permissions: {},
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

function generateHTMLExport(data: InitialData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
  <!-- Your content here -->
  ${data.content?.map(block => renderBlockHTML(block)).join('\n') || '<div class="p-8 text-center">No content</div>'}
</body>
</html>`;
}

function renderBlockHTML(block: any): string {
  const props = block.props || {};
  switch (block.type) {
    case "heading":
      return `<h1 class="text-3xl font-bold mb-4">${props.content || 'Heading'}</h1>`;
    case "centerHero":
      return `
<div class="text-center p-16 bg-gray-800 rounded-xl">
  <h1 class="text-5xl font-bold mb-4">${props.title || 'Welcome'}</h1>
  <p class="text-xl text-gray-300 mb-8">${props.subtitle || 'Start building'}</p>
  <button class="bg-purple-600 px-6 py-3 rounded-lg">${props.ctaText || 'Get Started'}</button>
</div>`;
    case "button":
      return `<button class="bg-purple-600 px-4 py-2 rounded-lg text-white">${props.content || 'Click me'}</button>`;
    default:
      return `<div class="p-4 bg-gray-800 rounded-lg"><p class="text-gray-400">${block.type} component</p></div>`;
  }
}

function generateReactExport(data: InitialData): string {
  return `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      ${data.content?.map(block => renderBlockJSX(block)).join('\n      ') || '<div className="p-8">No content</div>'}
    </div>
  );
}

${data.content?.map(block => renderComponentJSX(block)).join('\n\n') || ''}`;
}

function renderBlockJSX(block: any): string {
  const props = block.props || {};
  switch (block.type) {
    case "heading":
      return `<h1 className="text-3xl font-bold mb-4">${props.content || 'Heading'}</h1>`;
    case "button":
      return `<button className="bg-purple-600 px-4 py-2 rounded-lg">{props.content || 'Click me'}</button>`;
    default:
      return `<!-- ${block.type} -->`;
  }
}

function renderComponentJSX(block: any): string {
  return `// ${block.type} component`;
}