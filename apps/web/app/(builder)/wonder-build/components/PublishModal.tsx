'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/lib/builder/store';
import { useSovereignOS } from '../context/SovereignOSContext';
import { logger } from '@/lib/logger';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublishModal({ isOpen, onClose }: PublishModalProps) {
  const { editorCode } = useSovereignOS();
  const { elements } = useBuilderStore();
  const [wpUrl, setWpUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [target, setTarget] = useState<'wordpress' | 'html'>('wordpress');
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      const payload: any = {
        target,
        code: editorCode || '',
        elements,
      };
      if (target === 'wordpress') {
        if (!wpUrl) { setResult({ ok: false, message: 'WordPress URL is required' }); setPublishing(false); return; }
        payload.wpUrl = wpUrl;
        payload.apiKey = apiKey;
      }
      const res = await fetch('/api/projects/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message || (res.ok ? 'Published successfully' : 'Publish failed') });
    } catch (err: any) {
      setResult({ ok: false, message: err.message || 'Publish failed' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c101d] p-6 text-white shadow-2xl">
        <h2 className="text-lg font-bold">Publish</h2>
        <p className="mt-1 text-sm text-white/50">Deploy your builder content to a WordPress site or export as HTML.</p>

        <div className="mt-4 flex gap-2 rounded-lg border border-white/10 p-1">
          {(['wordpress', 'html'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                target === t ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {t === 'wordpress' ? '📝 WordPress' : '📄 HTML Export'}
            </button>
          ))}
        </div>

        {target === 'wordpress' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-white/70 block mb-1">WordPress Site URL</label>
              <input
                type="url"
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-white/70 block mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIW API Key from WordPress plugin"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showGuide ? '▾ Hide installation guide' : '▸ Need the plugin? Installation guide'}
            </button>
            {showGuide && (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2 text-[10px] text-white/60">
                <p className="font-semibold text-white/80">📦 AI Wonderland WordPress Plugin</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Download the plugin from <span className="text-purple-400">Settings → Plugins</span> in your builder dashboard.</li>
                  <li>Go to your WordPress admin: <span className="text-purple-400">Plugins → Add New → Upload Plugin</span>.</li>
                  <li>Upload the <code className="text-[9px] bg-black/40 px-1 py-0.5 rounded text-purple-300">ai-wonderland.zip</code> file and activate it.</li>
                  <li>Go to <span className="text-purple-400">Settings → AI Wonderland</span> and click <span className="text-purple-400">Generate API Key</span>.</li>
                  <li>Copy the key and paste it in the field above.</li>
                  <li>Click publish — your builder content will sync as a WordPress page!</li>
                </ol>
                <p className="text-[9px] text-white/30 pt-1 border-t border-white/5">
                  The plugin registers the <code className="text-[9px] bg-black/40 px-0.5 rounded">wp-json/aiw/v1/pages</code> REST endpoint automatically.
                </p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`mt-4 rounded-lg px-3 py-2 text-xs font-semibold ${
            result.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
          }`}>
            {result.message}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-40"
          >
            {publishing ? 'Publishing...' : `Publish to ${target === 'wordpress' ? 'WordPress' : 'HTML'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
