"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logger } from '@/lib/logger';

type ProjectStatus = {
  projectId: string;
  projectName: string;
  engine: string;
  status: "stopped" | "starting" | "running" | "error";
  runtimeUrl: string | null;
  internalUrl: string | null;
  health: any;
  createdAt: string;
};

type SaveStatus = {
  saving: boolean;
  lastSaved: string | null;
  error: string | null;
};

export default function WonderProjectPage({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ saving: false, lastSaved: null, error: null });
  const [isExporting, setIsExporting] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<Record<string, any>>({});
  const hasChangesRef = useRef(false);
  const supabase = createClient();

  async function loadProject() {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/runtime/status`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      setStatus(data);
      setError(null);
      
      if (data.status === "stopped" && !data.runtimeUrl) {
        await startRuntime();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startRuntime() {
    try {
      setStatus(prev => prev ? { ...prev, status: "starting" } : null);
      
      const res = await fetch(`/api/projects/${projectId}/runtime/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" })
      });
      
      const data = await res.json();
      
      if (data.success) {
        await pollUntilReady();
      } else {
        setError(data.error || "Failed to start runtime");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function pollUntilReady() {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      
      const res = await fetch(`/api/projects/${projectId}/runtime/status`);
      const data = await res.json();
      
      if (data.status === "running") {
        setStatus(data);
        return;
      }
      
      if (data.error) {
        setError(data.error);
        return;
      }
    }
    
    setError("Timeout waiting for runtime to start");
  }

  async function autoSave(files: Record<string, any>) {
    autoSaveRef.current = files;
    hasChangesRef.current = true;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!hasChangesRef.current) return;
      
      await saveToStorage(autoSaveRef.current);
    }, 5000);
  }

  async function saveToStorage(files: Record<string, any>) {
    try {
      setSaveStatus({ saving: true, lastSaved: saveStatus.lastSaved, error: null });
      
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSaveStatus({ 
          saving: false, 
          lastSaved: data.savedAt, 
          error: null 
        });
        hasChangesRef.current = false;
      } else {
        setSaveStatus({ 
          saving: false, 
          lastSaved: saveStatus.lastSaved, 
          error: data.error 
        });
      }
    } catch (err: any) {
      setSaveStatus({ 
        saving: false, 
        lastSaved: saveStatus.lastSaved, 
        error: err.message 
      });
    }
  }

  async function manualSave() {
    if (!hasChangesRef.current && !Object.keys(autoSaveRef.current).length) {
      return;
    }
    
    await saveToStorage(autoSaveRef.current);
  }

  async function exportProject(format: string = "wonder") {
    try {
      setIsExporting(true);
      
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, includeAssets: true })
      });
      
      if (!res.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${status?.projectName || projectId}.${format === 'html' ? 'html' : format === 'zip' ? 'zip' : 'wonder'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    loadProject();
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId]);

  useEffect(() => {
    if (status?.status !== "running") return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Save before leaving?";
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading {status?.projectName || "project"}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadProject}>Retry</button>
      </div>
    );
  }

  if (status?.status === "starting") {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Starting your 3D workspace...</p>
        <p className="hint">This may take up to 2 minutes</p>
      </div>
    );
  }

  if (status?.status === "running") {
    return (
      <div className="workspace">
        <iframe
          src={status.runtimeUrl || ""}
          style={{ width: "100%", height: "100vh", border: "none" }}
          allow="cross-origin-isolated"
        />
        
        <div className="toolbar">
          <div className="save-status">
            {saveStatus.saving ? (
              <span className="saving">Saving...</span>
            ) : saveStatus.lastSaved ? (
              <span className="saved">Saved {new Date(saveStatus.lastSaved).toLocaleTimeString()}</span>
            ) : saveStatus.error ? (
              <span className="error">{saveStatus.error}</span>
            ) : null}
          </div>
          
          <div className="actions">
            <button onClick={manualSave} disabled={saveStatus.saving}>
              Save Now
            </button>
            <button onClick={() => exportProject("wonder")} disabled={isExporting}>
              Export .wonder
            </button>
            <button onClick={() => exportProject("html")} disabled={isExporting}>
              Export HTML
            </button>
            <button onClick={() => exportProject("zip")} disabled={isExporting}>
              Export ZIP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="error">
      <h2>Unknown state</h2>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}