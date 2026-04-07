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
}

function LayoutWrapper() {
  return <Puck.Layout />;
}

export function PuckEditorClient({ 
  initialData, 
  projectId,
  readOnly = false,
}: PuckEditorClientProps) {
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [data, setData] = useState<InitialData | null>(initialData);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [localProjectId, setLocalProjectId] = useState<string | undefined>(projectId);
  const searchParams = useSearchParams();

  const hasContent = (data?.content?.length ?? 0) > 0;

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

  const shellClassName = useMemo(
    () => "h-[80vh] w-full overflow-hidden rounded-lg border border-white/10",
    [],
  );

  return (
    <div className={shellClassName}>
      {saveStatus && (
        <div className="absolute top-2 right-2 z-50 rounded-md bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur">
          {saveStatus}
        </div>
      )}
      
      {status === "loading" && (
        <div className="flex h-full animate-pulse items-center justify-center text-sm text-white/80">
          Loading editor...
        </div>
      )}
      
      {status === "empty" && (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-lg font-semibold text-white">No content yet</p>
          <p className="text-sm text-white/70">Start building your page with drag & drop blocks.</p>
          <button
            type="button"
            onClick={() => {
              setData({ content: [] });
              setStatus("loaded");
            }}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Create first block
          </button>
        </div>
      )}
      
      {status === "error" && (
        <div className="p-4 text-sm text-red-300">Failed to load editor content.</div>
      )}
      
      {status !== "loading" && (hasContent || status === "loaded") && (
        <Puck
          config={config}
          data={data ?? { content: [] }}
          onPublish={handlePublish}
          iframe={{
            enabled: false,
            permissions: {},
          }}
        >
          <LayoutWrapper />
        </Puck>
      )}
    </div>
  );
}
