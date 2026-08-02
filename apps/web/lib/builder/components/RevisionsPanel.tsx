'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { storageService } from '@/lib/builder/pipeline/StorageService';

interface Revision {
  id: string;
  version_number: number;
  created_at: string;
}

interface RevisionsPanelProps {
  projectId: string;
}

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function RevisionsPanel({ projectId }: RevisionsPanelProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<{ type: 'save' | 'restore'; status: 'loading' | 'ok' | 'error'; label: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const revs = await storageService.loadRevisions();
      setRevisions(revs as Revision[]);
    } catch {
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (projectId) load();
  }, [projectId, load]);

  const saveRevision = async () => {
    setAction({ type: 'save', status: 'loading', label: 'Saving revision…' });
    const rev = await storageService.saveRevision();
    if (rev) {
      setAction({ type: 'save', status: 'ok', label: 'Revision saved' });
      load();
    } else {
      setAction({ type: 'save', status: 'error', label: 'Failed to save revision' });
    }
  };

  const restore = async (revision: Revision) => {
    if (!confirm(`Restore revision #${revision.version_number} (${formatDate(revision.created_at)})? This will overwrite the current canvas.`)) return;
    setAction({ type: 'restore', status: 'loading', label: `Restoring #${revision.version_number}…` });
    const ok = await storageService.restoreRevision(revision.id);
    setAction({ type: 'restore', status: ok ? 'ok' : 'error', label: ok ? 'Restored' : 'Restore failed' });
  };

  return (
    <div className="p-2 text-xs text-white/80">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-white text-[10px] uppercase tracking-wider text-white/40">Revisions</span>
        <button
          onClick={saveRevision}
          disabled={action?.status === 'loading'}
          className="px-1.5 py-0.5 rounded text-[9px] bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 disabled:opacity-50"
          aria-label="Save revision"
        >
          + Save
        </button>
      </div>

      {action && (
        <div
          className="mb-2 text-[9px] px-1.5 py-0.5 rounded"
          style={{
            background: action.status === 'ok' ? 'rgba(34,197,94,0.15)' : action.status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(147,51,234,0.15)',
            color: action.status === 'ok' ? '#22c55e' : action.status === 'error' ? '#ef4444' : '#a78bfa',
          }}
        >
          {action.label}
        </div>
      )}

      {loading ? (
        <div className="text-[9px] text-white/40">Loading…</div>
      ) : revisions.length === 0 ? (
        <div className="text-[9px] text-white/40">No revisions yet. Click + Save to create one.</div>
      ) : (
        <div className="space-y-1.5">
          {revisions.map((r) => (
            <div key={r.id} className="rounded border border-white/10 bg-black/40 p-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/60">#{r.version_number}</span>
                <span className="text-[9px] text-white/40">{formatDate(r.created_at)}</span>
              </div>
              <button
                onClick={() => restore(r)}
                className="mt-1 w-full px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
