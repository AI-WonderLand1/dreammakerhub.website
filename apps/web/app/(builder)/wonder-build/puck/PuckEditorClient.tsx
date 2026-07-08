"use client";

import { Puck } from "@puckeditor/core";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Eye, Monitor, Code, Clock, Download, Sparkles, Box, Sun, Moon,
  Undo2, Redo2, Grid3x3, Copy, Scissors, Clipboard,
  Layers, PanelLeft, PanelRight, LayoutGrid, Columns3, Rows3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { searchExternalAssets, downloadAssetToStorage, type ExternalAsset } from "@/lib/ai/assetLibrary";
import { useAuth } from "@/lib/supabase/auth-context";
import "@puckeditor/core/puck.css";
import "@/styles/puck-dark-fix.css";
import "@/styles/puck-framer-theme.css";
import { config } from "./puck.config";
import { retrievePuckData } from "@/lib/ai-to-puck";
import { useAutoSave } from "@/components/VersionHistory";
import { TempStorageWarning } from "@/components/TempStorageWarning";
import { PuckAIPanel } from "@/components/PuckAIPanel";
import { VersionHistory } from "@/components/VersionHistory";
import { PuckPreview } from "./PuckPreview";
import { ElementPanel } from "./ElementPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { BreakpointSwitcher, breakpointDimensions, type Breakpoint } from "./BreakpointSwitcher";
import { BlocksLibrary } from "./BlocksLibrary";
import { AssetManager } from "./AssetManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EditorStatus = "loading" | "loaded" | "empty" | "error" | "saving" | "saved";

type InitialData = {
  content: Array<{ type: string; props: Record<string, unknown> }>;
  root: { type: string; props: Record<string, unknown> };
};

type ContentItem = { type: string; props: Record<string, unknown> };

interface PuckEditorClientProps {
  initialData: InitialData | null;
  projectId?: string;
  readOnly?: boolean;
  showAIPanel?: boolean;
  viewMode?: "visual" | "preview" | "code";
  onDataChange?: (data: InitialData) => void;
  onModeChange?: (mode: "visual" | "preview" | "code") => void;
}

function generateHTMLExport(data: InitialData): string {
  const items = data.content || [];
  const html = items.map((item) => {
    if (item.type === "Heading" || item.type === "heading") {
      return `<h1>${(item.props?.content as string) || "Heading"}</h1>`;
    }
    if (item.type === "Paragraph" || item.type === "typography") {
      return `<p>${(item.props?.content as string) || "Text"}</p>`;
    }
    return `<div class="block-${item.type}">${item.type}</div>`;
  }).join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Puck Export</title></head><body>${html}</body></html>`;
}

function generateReactExport(data: InitialData): string {
  const items = data.content || [];
  const comps = items.map((item) => {
    if (item.type === "Heading" || item.type === "heading") {
      return `  <h1>${(item.props?.content as string) || "Heading"}</h1>`;
    }
    if (item.type === "Paragraph" || item.type === "typography") {
      return `  <p>${(item.props?.content as string) || "Text"}</p>`;
    }
    return `  <div>${item.type}</div>`;
  }).join("\n");
  return `import React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n${comps}\n    </div>\n  );\n}`;
}

function PuckAIButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg"
    >
      <Sparkles className="w-4 h-4" />
      AI
    </button>
  );
}

function TempStorageBadge({ hoursRemaining = 24 }: { hoursRemaining?: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-medium text-amber-300">
      <Clock className="w-3 h-3" />
      <span>{hoursRemaining}h left</span>
    </div>
  );
}

export function PuckEditorClient({
  initialData,
  projectId,
  readOnly = false,
  showAIPanel = true,
  viewMode,
  onDataChange,
}: PuckEditorClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [data, setData] = useState<InitialData | null>(initialData);
  const [saveStatus, setSaveStatus] = useState("");
  const [localProjectId, setLocalProjectId] = useState<string | undefined>(projectId);
  const [showAI, setShowAI] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTempWarning, setShowTempWarning] = useState(false);
  const [showAssetLib, setShowAssetLib] = useState(false);
  const [assets, setAssets] = useState<ExternalAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetSearching, setAssetSearching] = useState(false);
  const [importingAsset, setImportingAsset] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"visual" | "preview" | "code">(viewMode || "visual");
  const [editorTheme, setEditorTheme] = useState<"dark" | "framer">("dark");
  const [storageInfo, setStorageInfo] = useState<{ type: string; hoursRemaining?: number; expiresAt?: string }>({ type: "platform" });
  const searchParams = useSearchParams();

  const updateData = useCallback((updater: InitialData | ((prev: InitialData | null) => InitialData)) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next) {
        onDataChange?.(next);
      }
      return next;
    });
  }, [onDataChange]);


  // New state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [showLayers, setShowLayers] = useState(false);
  const [showBlockLib, setShowBlockLib] = useState(false);
  const [showAssetMgr, setShowAssetMgr] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [clipboard, setClipboard] = useState<ContentItem | null>(null);
  const [showElementPanel, setShowElementPanel] = useState(true);
  const [showPropsPanel, setShowPropsPanel] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<string>("elements");

  // Undo/redo stacks
  const [undoStack, setUndoStack] = useState<ContentItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ContentItem[][]>([]);
  const historyRef = useRef<ContentItem[][]>([]);

  const hasContent = (data?.content?.length ?? 0) > 0;

  const { lastSaved, saving: autoSaving } = useAutoSave(localProjectId || null, data, 60000);

  const handleApplyAIData = useCallback((newData: InitialData) => {
    updateData(newData);
    setStatus("loaded");
    setShowAI(false);
  }, [updateData]);

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

  const selectedElement = selectedIndex !== null && data?.content?.[selectedIndex]
    ? data.content[selectedIndex]
    : null;

  const selectedId = selectedIndex !== null ? `item-${selectedIndex}` : null;

  // ---- Undo / Redo ----
  const pushHistory = useCallback((newContent: ContentItem[]) => {
    setUndoStack((prev) => {
      const next = [...prev.slice(-50), newContent];
      return next;
    });
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !data) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, data.content]);
    setUndoStack((u) => u.slice(0, -1));
    updateData({ ...data, content: prev });
  }, [undoStack, data]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !data) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, data.content]);
    setRedoStack((r) => r.slice(0, -1));
    updateData({ ...data, content: next });
  }, [redoStack, data]);

  // ---- Data change ----
  const prevContentRef = useRef<ContentItem[]>([]);
  const handleDataChange = useCallback((newData: any) => {
    const content = newData.content || [];
    const root = newData.root || { type: "Fragment", props: {} };
    if (prevContentRef.current.length > 0 && prevContentRef.current !== content) {
      pushHistory(prevContentRef.current);
    }
    prevContentRef.current = content;
    updateData({ content, root });
  }, [pushHistory, updateData]);

  // ---- Add component ----
  const handleAddComponent = useCallback((type: string, props: Record<string, unknown> = {}) => {
    if (!data) return;
    const newItem: ContentItem = { type, props: { ...props } };
    const newContent = [...data.content, newItem];
    pushHistory(data.content);
    updateData({ ...data, content: newContent });
    setSelectedIndex(newContent.length - 1);
    setStatus("loaded");
  }, [data, pushHistory, updateData]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // View modes
      if (ctrl && e.key === "1") {
        e.preventDefault();
        setEditorMode("visual");
      }
      if (ctrl && e.key === "2") {
        e.preventDefault();
        setEditorMode("preview");
      }
      if (ctrl && e.key === "3") {
        e.preventDefault();
        setEditorMode("code");
      }

      // AI Assistant toggle
      if (ctrl && shift && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setShowAI((prev) => !prev);
      }

      // Sidebar toggle
      if (ctrl && shift && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setShowElementPanel((prev) => !prev);
      }

      // Undo: Ctrl+Z
      if (ctrl && e.key === "z" && !shift) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((ctrl && e.key === "y") || (ctrl && e.key === "z" && shift)) {
        e.preventDefault();
        handleRedo();
      }

      // Copy: Ctrl+C
      if (ctrl && e.key === "c" && selectedIndex !== null && data) {
        e.preventDefault();
        setClipboard({ ...data.content[selectedIndex] });
      }

      // Cut: Ctrl+X
      if (ctrl && e.key === "x" && selectedIndex !== null && data) {
        e.preventDefault();
        const item = data.content[selectedIndex];
        setClipboard({ ...item });
        const newContent = data.content.filter((_, i) => i !== selectedIndex);
        pushHistory(data.content);
        updateData({ ...data, content: newContent });
        setSelectedIndex(null);
      }

      // Paste: Ctrl+V
      if (ctrl && e.key === "v" && clipboard && data) {
        e.preventDefault();
        const newItem: ContentItem = {
          ...clipboard,
          props: { ...clipboard.props },
        };
        const insertAt = selectedIndex !== null ? selectedIndex + 1 : data.content.length;
        const newContent = [...data.content.slice(0, insertAt), newItem, ...data.content.slice(insertAt)];
        pushHistory(data.content);
        updateData({ ...data, content: newContent });
        setSelectedIndex(insertAt);
      }

      // Select all: Ctrl+A
      if (ctrl && e.key === "a" && data) {
        e.preventDefault();
        setSelectedIndices(new Set(data.content.map((_, i) => i)));
      }

      // Delete: Backspace/Del while an element is selected
      if ((e.key === "Backspace" || e.key === "Delete") && selectedIndex !== null && data) {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          const newContent = data.content.filter((_, i) => i !== selectedIndex);
          pushHistory(data.content);
          updateData({ ...data, content: newContent });
          setSelectedIndex(null);
        }
      }
    }
  }, [data, selectedIndex, clipboard, handleUndo, handleRedo, pushHistory, setEditorMode, setShowAI, setShowElementPanel]);

  // ---- Listen for external events (e.g. from ComponentsLibrary) ----
  useEffect(() => {
    const handleToggleAI = (e: any) => {
      if (e.detail) setShowAI(true);
    };
    const handleAddBlock = (e: any) => {
      const { type, props } = e.detail;
      handleAddComponent(type);
      // Note: props could be used to further customize the added block
    };

    window.addEventListener('toggleAI', handleToggleAI);
    window.addEventListener('addBlock', handleAddBlock);
    return () => {
      window.removeEventListener('toggleAI', handleToggleAI);
      window.removeEventListener('addBlock', handleAddBlock);
    };
  }, [handleAddComponent]);

  // ---- Content builder for layers ----
  const layerTree = useMemo(() => {
    if (!data?.content) return [];
    return data.content.map((item, i) => ({
      id: `item-${i}`,
      type: item.type,
      children: [],
    }));
  }, [data]);

  // ---- Load / Publish ----
  useEffect(() => {
    const aiDataKey = searchParams?.get("ai_data");
    if (aiDataKey) {
      const aiData = retrievePuckData(aiDataKey);
      if (aiData) {
        setStatus("loaded");
        updateData({
          content: aiData.content,
          root: aiData.root || { type: "Fragment", props: {} },
        });
        return;
      }
    }
    if (initialData?.content?.length) {
      setStatus("loaded");
      updateData(initialData);
    } else if (projectId) {
      loadProject(projectId);
    } else {
      setStatus("empty");
    }
  }, [initialData, projectId, searchParams, updateData]);

  const loadProject = async (pid: string) => {
    setStatus("loading");
    setSaveStatus("Loading...");
    try {
      const res = await fetch(`/api/puck/save?projectId=${pid}`);
      const json = await res.json();
      if (json.ok && json.project) {
        updateData(json.project);
        setLocalProjectId(pid);
        setStatus("loaded");
        if (json.storageInfo) {
          setStorageInfo(json.storageInfo);
          if (json.storageInfo.type === "temp" && json.storageInfo.hoursRemaining !== null && json.storageInfo.hoursRemaining < 24) {
            setShowTempWarning(true);
          }
        }
      } else {
        setStatus("empty");
      }
    } catch {
      setStatus("error");
    }
    setSaveStatus("");
  };

  const handlePublish = useCallback(async (publishData: unknown) => {
    if (readOnly) { setSaveStatus("Read-only mode"); return; }
    const pid = localProjectId || `puck-${Date.now()}`;
    setStatus("saving");
    setSaveStatus("Saving...");
    try {
      const res = await fetch("/api/puck/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid, content: publishData }),
      });
      const json = await res.json();
      if (json.ok) {
        setLocalProjectId(pid);
        setSaveStatus("Saved!");
      } else {
        setSaveStatus(`Error: ${json.error}`);
      }
    } catch {
      setSaveStatus("Save failed");
    }
    setStatus("loaded");
    setTimeout(() => setSaveStatus(""), 3000);
  }, [localProjectId, readOnly]);

  const handleSaveToPlatform = useCallback(async () => {
    if (!localProjectId) return;
    try {
      const res = await fetch("/api/puck/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: localProjectId, storageType: "platform" }),
      });
      const json = await res.json();
      if (json.ok) {
        setStorageInfo({ type: "platform" });
        setShowTempWarning(false);
        setSaveStatus("Saved to platform!");
      }
    } catch { /* ignore */ }
  }, [localProjectId]);

  // ---- Asset search ----
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
        const newItem: ContentItem = {
          type: "ThreeCanvasWrapperBlock",
          props: { label: asset.name, height: "md", sceneType: "3d-world", showControls: true, modelUrl: result.localUrl },
        };
        updateData((prev) => prev ? { ...prev, content: [...prev.content, newItem] } : prev);
      }
    } finally {
      setImportingAsset(null);
    }
  }, [user]);

  // ---- Asset manager insert ----
  const handleInsertAsset = useCallback((url: string, name: string) => {
    if (!data) return;
    const newItem: ContentItem = {
      type: "image",
      props: { src: url, alt: name },
    };
    updateData({ ...data, content: [...data.content, newItem] });
    setShowAssetMgr(false);
  }, [data]);

  // ---- Blocks library save ----
  const handleSaveBlock = useCallback((type: string, props: Record<string, unknown>) => {
    setShowBlockLib(true);
  }, []);

  // ---- Update props ----
  const handleUpdateProps = useCallback((newProps: Record<string, unknown>) => {
    if (selectedIndex === null || !data) return;
    const newContent = data.content.map((item, i) =>
      i === selectedIndex ? { ...item, props: newProps } : item
    );
    updateData({ ...data, content: newContent });
  }, [selectedIndex, data]);

  // ---- Delete from layers ----
  const handleDeleteLayer = useCallback((id: string) => {
    const idx = parseInt(id.replace("item-", ""), 10);
    if (isNaN(idx) || !data) return;
    const newContent = data.content.filter((_, i) => i !== idx);
    pushHistory(data.content);
    updateData({ ...data, content: newContent });
    if (selectedIndex === idx) setSelectedIndex(null);
  }, [data, selectedIndex, pushHistory]);

  // ---- Wrap in container (nesting) ----
  const handleWrapInContainer = useCallback((containerType: string) => {
    if (selectedIndex === null || !data) return;
    const item = data.content[selectedIndex];
    const container: ContentItem = {
      type: containerType,
      props: { children: [item] },
    };
    const newContent = data.content.map((c, i) => (i === selectedIndex ? container : c));
    pushHistory(data.content);
    updateData({ ...data, content: newContent });
  }, [selectedIndex, data, pushHistory]);

  // ---- Canvas width (responsive breakpoint) ----
  const canvasWidth = useMemo(() => {
    const dim = breakpointDimensions[breakpoint];
    return breakpoint === "desktop" ? "100%" : `${dim.width}px`;
  }, [breakpoint]);

  // ---- Shell class for Puck ----
  const shellClassName = useMemo(
    () => "w-full overflow-hidden",
    [],
  );

  return (
    <div className="relative">
      {/* ---- Top Bar (floating) ---- */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-lg border-b border-white/10 rounded-t-xl min-h-[40px]">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button onClick={() => setEditorMode("visual")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                editorMode === "visual" ? "bg-violet-600 text-white" : "text-white/50 hover:text-white"
              }`}
            ><Eye className="w-3 h-3" /> Edit</button>
            <button onClick={() => setEditorMode("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                editorMode === "preview" ? "bg-violet-600 text-white" : "text-white/50 hover:text-white"
              }`}
            ><Monitor className="w-3 h-3" /> Preview</button>
            <button onClick={() => setEditorMode("code")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                editorMode === "code" ? "bg-violet-600 text-white" : "text-white/50 hover:text-white"
              }`}
            ><Code className="w-3 h-3" /> Code</button>
          </div>

          {/* Sidebar toggles */}
          <button
            onClick={() => setShowElementPanel(!showElementPanel)}
            className={`p-1.5 rounded text-[11px] font-medium transition-colors ${
              showElementPanel ? "bg-violet-600/30 text-violet-300" : "text-white/50 hover:text-white"
            }`}
            title="Toggle element panel"
          ><PanelLeft className="w-3.5 h-3.5" /></button>

          <button
            onClick={() => setShowPropsPanel(!showPropsPanel)}
            className={`p-1.5 rounded text-[11px] font-medium transition-colors ${
              showPropsPanel ? "bg-violet-600/30 text-violet-300" : "text-white/50 hover:text-white"
            }`}
            title="Toggle properties panel"
          ><PanelRight className="w-3.5 h-3.5" /></button>

          <div className="w-px h-4 bg-white/10" />

          {/* Layers toggle */}
          <button
            onClick={() => { setShowLayers(!showLayers); if (!showLayers) setSidebarTab("layers"); }}
            className={`p-1.5 rounded text-[11px] font-medium transition-colors ${
              showLayers ? "bg-violet-600/30 text-violet-300" : "text-white/50 hover:text-white"
            }`}
            title="Toggle layers panel"
          ><Layers className="w-3.5 h-3.5" /></button>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          ><Undo2 className="w-3.5 h-3.5" /></button>
          <button onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          ><Redo2 className="w-3.5 h-3.5" /></button>

          <div className="w-px h-4 bg-white/10" />

          {/* Breakpoint switcher */}
          <BreakpointSwitcher
            current={breakpoint}
            onChange={setBreakpoint}
            onToggleGrid={() => setGridEnabled(!gridEnabled)}
            gridEnabled={gridEnabled}
          />

          <div className="w-px h-4 bg-white/10" />

          {/* Wrap in container (nesting) */}
          {selectedIndex !== null && (
            <>
              <button onClick={() => handleWrapInContainer("Row")}
                className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Wrap in Row"
              ><Rows3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleWrapInContainer("Column")}
                className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Wrap in Column"
              ><Columns3 className="w-3.5 h-3.5" /></button>
              <div className="w-px h-4 bg-white/10" />
            </>
          )}

          {/* Blocks library */}
          <BlocksLibrary
            onAddBlock={(type, props) => handleAddComponent(type)}
            onSaveBlock={handleSaveBlock}
          />

          {/* Asset manager */}
          <button
            onClick={() => setShowAssetMgr(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
          ><Download className="w-3.5 h-3.5" /><span className="hidden sm:inline">Assets</span></button>

          {/* AI */}
          {showAIPanel && (
            <PuckAIButton onClick={() => setShowAI(!showAI)} />
          )}

          <div className="w-px h-4 bg-white/10" />

          {/* Version History */}
          {localProjectId && (
            <VersionHistory
              projectId={localProjectId}
              onRestore={(content) => {
                updateData(content);
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

          {/* Theme toggle */}
          <button onClick={() => setEditorTheme(editorTheme === "dark" ? "framer" : "dark")}
            className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle theme"
          >{editorTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button>

          {/* Export */}
          <button onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
          ><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>

      {/* ---- Main Editor Area ---- */}
      <div
        className="flex"
        style={{ height: `calc(80vh - 40px)` }}
      >
        {/* Left Sidebar - Element Panel / Layers */}
        {showElementPanel && (
          <div className="w-64 shrink-0 border-r border-white/10 bg-black/20 overflow-hidden">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="h-full flex flex-col">
              <TabsList className="mx-2 mt-2 bg-white/5 border border-white/10">
                <TabsTrigger value="elements" className="text-xs data-[state=active]:bg-violet-600 flex-1">
                  Elements
                </TabsTrigger>
                <TabsTrigger value="layers" className="text-xs data-[state=active]:bg-violet-600 flex-1">
                  Layers
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="elements" className="h-full mt-0">
                  <ElementPanel onAddComponent={handleAddComponent} />
                </TabsContent>
                <TabsContent value="layers" className="h-full mt-0">
                  <LayersPanel
                    content={layerTree}
                    selectedId={selectedId ?? undefined}
                    onSelect={(id) => {
                      const idx = parseInt(id.replace("item-", ""), 10);
                      if (!isNaN(idx)) setSelectedIndex(idx);
                    }}
                    onDelete={handleDeleteLayer}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {/* Center - Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Grid overlay */}
          {gridEnabled && (
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />
          )}

          <div
            className="mx-auto h-full transition-all duration-300"
            style={{ maxWidth: canvasWidth }}
          >
            {status === "loading" && (
              <div className="h-full flex items-center justify-center text-sm text-white/80 bg-black/20 rounded-lg">
                Loading editor...
              </div>
            )}

            {status === "empty" && (
              <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-black/20 rounded-lg">
                <Sparkles className="w-12 h-12 text-violet-400/50" />
                <p className="text-lg font-semibold text-white">Start building your page</p>
                <p className="text-sm text-white/60 max-w-md">
                  Use Wonderbuild to generate a layout, or add elements from the sidebar.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowAI(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white"
                  ><Sparkles className="w-4 h-4" /> Build with AI</button>
                  <button onClick={() => { updateData({ content: [], root: { type: "Fragment", props: {} } }); setStatus("loaded"); }}
                    className="rounded-md border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                  >Start Blank</button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="p-4 text-sm text-red-300 bg-black/20 rounded-lg">Failed to load editor content.</div>
            )}

            {status !== "loading" && (hasContent || status === "loaded") && (
              <>
                {editorMode === "visual" && (
                  <div className={`${editorTheme === "framer" ? "puck-framer-theme" : ""} h-full`}>
                    <style>{`
                      .puck-editor [class*="Sidebar"], .puck [class*="Sidebar"] { display: none !important; }
                      .puck-editor [class*="sidebar"], .puck [class*="sidebar"] { display: none !important; }
                      .puck-editor [class*="PanelHeader"] ~ [class*="panel"] { display: none !important; }
                      .puck-editor [class*="panel_"]:first-of-type { display: none !important; }
                      .puck-editor [class*="panel_"]:last-of-type { display: none !important; }
                      .puck-editor [class*="panel_"]:nth-child(3) { display: none !important; }

                      .puck-editor, .puck { height: 100% !important; overflow: hidden !important; }
                      .puck-editor > div, .puck > div { height: 100% !important; }
                      .puck-editor [class*="main"], .puck-editor [class*="canvas"],
                      .puck [class*="main"], .puck [class*="canvas"] { flex: 1 !important; width: 100% !important; }
                    `}</style>
                    <Puck
                      config={config}
                      data={data ?? { content: [] }}
                      onPublish={handlePublish}
                      onChange={handleDataChange}
                      iframe={{ enabled: false }}
                    >
                      <Puck.Layout />
                    </Puck>
                  </div>
                )}

                {editorMode === "preview" && (
                  <div className="h-full rounded-lg overflow-hidden border border-white/10 mx-auto" style={{ maxWidth: canvasWidth }}>
                    <PuckPreview data={data || { content: [] }} />
                  </div>
                )}

                {editorMode === "code" && (
                  <div className="h-full rounded-lg border border-white/10 bg-black/20 overflow-hidden">
                    <pre className="p-4 text-xs text-white/70 overflow-auto h-full font-mono">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {showPropsPanel && (
          <div className="w-72 shrink-0 border-l border-white/10 bg-black/20 overflow-hidden">
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdateProps={handleUpdateProps}
            />
          </div>
        )}
      </div>

      {/* Save status badge */}
      {saveStatus && (
        <div className="absolute top-12 right-4 z-50 rounded-md bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur">
          {saveStatus}
        </div>
      )}

      {/* ---- Modals / Overlays ---- */}
      <AssetManager
        onInsertAsset={handleInsertAsset}
      />

      <PuckAIPanel
        currentData={data}
        onApplyData={handleApplyAIData}
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />

      {showTempWarning && (
        <TempStorageWarning
          isOpen={showTempWarning}
          onClose={() => setShowTempWarning(false)}
          onSaveToPlatform={handleSaveToPlatform}
          onConnectCloud={() => window.location.href = "/dashboard/settings/cloud"}
          onExport={() => setShowExportModal(true)}
          hoursRemaining={storageInfo?.hoursRemaining || 24}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="bg-[#0a0a10] border border-white/20 rounded-2xl max-w-md w-full mx-4 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Export Project</h3>
              <button onClick={() => setShowExportModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg"
              ><span className="w-5 h-5 text-white/40">&times;</span></button>
            </div>

            <div className="space-y-3">
              <button onClick={() => handleExport("html")}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              ><div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">HTML</div>
                <div><p className="font-medium text-white">HTML Export</p><p className="text-xs text-white/60">Static HTML file</p></div>
              </button>
              <button onClick={() => handleExport("react")}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              ><div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-400">JSX</div>
                <div><p className="font-medium text-white">React Export</p><p className="text-xs text-white/60">React component</p></div>
              </button>
              <button onClick={() => handleExport("json")}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              ><div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center font-bold text-green-400">JSON</div>
                <div><p className="font-medium text-white">JSON Export</p><p className="text-xs text-white/60">Project data</p></div>
              </button>
              <button onClick={() => { setShowExportModal(false); router.push("/wonder-build/playcanvas"); }}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
              ><div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">&#x1F3AE;</div>
                <div><p className="font-medium text-white">PlayCanvas Scene</p><p className="text-xs text-white/60">Open in 3D scene editor</p></div>
              </button>
            </div>

            <button onClick={() => setShowExportModal(false)}
              className="w-full mt-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >Cancel</button>
          </div>
        </div>
      )}

      {showAssetLib && (
        <div className="absolute left-2 top-14 z-50 w-96 rounded-lg border border-white/10 bg-[#1a1a2e] p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <input value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchAssets(); }}
              placeholder="Search 3D assets..." className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30" />
            <button onClick={handleSearchAssets} disabled={assetSearching}
              className="rounded bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500 disabled:opacity-40"
            >{assetSearching ? "..." : "Search"}</button>
          </div>
          {assets.length > 0 && (
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {assets.map((asset) => (
                <button key={asset.id} onClick={() => handleImportAsset(asset)}
                  disabled={importingAsset === asset.id}
                  className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-2 hover:border-violet-500/50 disabled:opacity-40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-white/10 text-lg">
                    <Box className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="max-w-16 truncate text-[10px] text-white/60">{asset.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
