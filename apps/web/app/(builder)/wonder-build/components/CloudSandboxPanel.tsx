'use client';

import { useEffect, useState, useRef } from 'react';
import { useSovereignOS } from '../context/SovereignOSContext';

type CloudProvider = 's3' | 'gcs' | 'azure' | 'r2' | 'supabase';
type CloudStatus = 'connected' | 'disconnected';

interface CloudConnection {
  id: string;
  name: string;
  provider: CloudProvider;
  bucketOrContainer: string;
  region: string | null;
  status: CloudStatus;
  connectedAt: string;
}

const PROVIDER_ICONS: Record<CloudProvider, string> = {
  s3: '🪣', gcs: '☁️', azure: '🔷', r2: '⚡', supabase: '⚡',
};

const PROVIDER_LABELS: Record<CloudProvider, string> = {
  s3: 'AWS S3', gcs: 'GCP Storage', azure: 'Azure Blob', r2: 'Cloudflare R2', supabase: 'Supabase',
};

export function CloudSandboxPanel() {
  const { editorCode, setEditorCode, result, running } = useSovereignOS();

  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [view, setView] = useState<'code' | 'cloud'>('code');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cloud-connections');
        if (res.ok) {
          const data = await res.json() as { connections?: CloudConnection[] };
          setConnections(data.connections ?? []);
        }
      } catch { /* no auth = no connections */ }
      finally { setLoadingConnections(false); }
    }
    load();
  }, []);

  const connectedCloud = connections.find((c) => c.status === 'connected');

  async function saveToCloud() {
    if (!connectedCloud || !editorCode) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const filename = `wonder-build-${Date.now()}.html`;
      const res = await fetch('/api/builder/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: `sandbox-${connectedCloud.id}`,
          canvasData: { assets: { filename, code: editorCode }, styles: '' },
        }),
      });
      setSaveStatus(res.ok ? `Saved to ${connectedCloud.name}` : 'Save failed');
    } catch {
      setSaveStatus('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0e0e10]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/60 px-3 py-2">
        {/* View toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {(['code', 'cloud'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-[10px] font-semibold transition-colors ${
                view === v
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {v === 'code' ? '📄 Code' : '☁️ Cloud'}
            </button>
          ))}
        </div>

        {/* Cloud status chip */}
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connectedCloud ? 'bg-green-400' : 'bg-white/20'
            }`}
          />
          <span className="text-[10px] text-white/40 font-mono">
            {connectedCloud
              ? `${PROVIDER_ICONS[connectedCloud.provider]} ${connectedCloud.name}`
              : 'No cloud connected'}
          </span>
        </div>

        {/* Save button */}
        {editorCode && connectedCloud && (
          <button
            onClick={saveToCloud}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300 transition-colors hover:bg-violet-500/20 disabled:opacity-40"
          >
            {saving ? '⏳ Saving…' : '☁ Save to Cloud'}
          </button>
        )}

        {!connectedCloud && (
          <a
            href="/connect-storage"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
          >
            + Connect Cloud
          </a>
        )}
      </div>

      {saveStatus && (
        <div className={`shrink-0 px-3 py-1.5 text-[10px] font-semibold ${
          saveStatus.includes('fail') ? 'bg-red-500/10 text-red-300' : 'bg-green-500/10 text-green-300'
        }`}>
          {saveStatus}
        </div>
      )}

      {/* Code view */}
      {view === 'code' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          {!editorCode && !running && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-4xl opacity-20">📄</span>
              <p className="text-sm font-semibold text-white/20">No code yet</p>
              <p className="text-[11px] text-white/15">
                Describe what you want in the AI Builder panel<br />and hit Build — code streams here instantly.
              </p>
            </div>
          )}

          {running && !editorCode && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-6 rounded-full bg-violet-500 animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-[11px] text-violet-300 animate-pulse">Agents building — code incoming…</p>
            </div>
          )}

          {editorCode && (
            <textarea
              ref={textareaRef}
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              spellCheck={false}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-[11px] text-green-300/90 leading-relaxed outline-none placeholder-white/10 selection:bg-violet-500/30"
              style={{ fontFamily: '"Fira Code", "Cascadia Code", monospace' }}
            />
          )}
        </div>
      )}

      {/* Cloud view */}
      {view === 'cloud' && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 pb-1">
            Connected Cloud Providers
          </p>

          {loadingConnections && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingConnections && connections.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <p className="text-[11px] text-white/30 mb-3">No cloud providers connected yet.</p>
              <a
                href="/connect-storage"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-[11px] font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors"
              >
                ☁ Connect Your Cloud Storage
              </a>
            </div>
          )}

          {connections.map((conn) => (
            <div
              key={conn.id}
              className={`rounded-xl border p-3 transition-all ${
                conn.status === 'connected'
                  ? 'border-green-500/25 bg-green-500/5'
                  : 'border-white/5 bg-white/[0.02] opacity-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{PROVIDER_ICONS[conn.provider]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/80 truncate">{conn.name}</p>
                  <p className="text-[10px] text-white/30 font-mono truncate">
                    {PROVIDER_LABELS[conn.provider]} · {conn.bucketOrContainer}
                    {conn.region ? ` · ${conn.region}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    conn.status === 'connected'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-white/5 text-white/30'
                  }`}
                >
                  {conn.status}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-white/10">
            <a
              href="/dashboard/settings/byoc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              Manage cloud connections →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
