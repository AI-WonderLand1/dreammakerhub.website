"use client";

import { useState, useEffect, useCallback } from "react";
import { History, RotateCcw, Clock, Trash2, X } from "lucide-react";

interface Version {
  id: string;
  created_at: string;
  snapshot: string | null;
}

interface VersionHistoryProps {
  projectId: string;
  onRestore: (content: any) => void;
  onClose?: () => void;
}

export function VersionHistory({ projectId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadVersions();
    }
  }, [isOpen, projectId]);

  async function loadVersions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/versions?projectId=${projectId}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(versionId: string) {
    if (!confirm("Restore this version? Your current work will be saved as a new version.")) {
      return;
    }

    setRestoring(versionId);
    try {
      const res = await fetch("/api/versions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, projectId }),
      });

      if (res.ok) {
        const data = await res.json();
        onRestore(data.content);
        await loadVersions();
      } else {
        alert("Failed to restore version");
      }
    } catch (err) {
      console.error("Restore error:", err);
      alert("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(versionId: string) {
    if (!confirm("Delete this version? This cannot be undone.")) {
      return;
    }

    try {
      await fetch(`/api/versions?versionId=${versionId}`, { method: "DELETE" });
      setVersions(versions.filter(v => v.id !== versionId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
        title="Version History"
      >
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">History</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">Version History</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">No saved versions yet</p>
                  <p className="text-white/20 text-sm mt-1">
                    Versions are saved automatically when you edit
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        index === 0
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                              Current
                            </span>
                          )}
                          <p className="text-sm text-white truncate">
                            {version.snapshot || "Auto-save"}
                          </p>
                        </div>
                        <p className="text-xs text-white/40">
                          {formatTime(version.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {index !== 0 && (
                          <button
                            onClick={() => handleRestore(version.id)}
                            disabled={restoring === version.id}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                            title="Restore this version"
                          >
                            {restoring === version.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {versions.length > 1 && index !== 0 && (
                          <button
                            onClick={() => handleDelete(version.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                            title="Delete this version"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-white/30 text-center">
                Last 30 versions are kept. Older versions are automatically deleted.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook for auto-saving versions
export function useAutoSave(projectId: string | null, content: any, delayMs = 30000) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const saveVersion = useCallback(async () => {
    if (!projectId || !content) return;

    setSaving(true);
    try {
      await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content,
          snapshot: "Auto-save",
        }),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [projectId, content]);

  useEffect(() => {
    if (!projectId || !content) return;

    const interval = setInterval(saveVersion, delayMs);
    return () => clearInterval(interval);
  }, [projectId, content, delayMs, saveVersion]);

  return { lastSaved, saving, saveVersion };
}