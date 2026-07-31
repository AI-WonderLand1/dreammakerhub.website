'use client';
import { useState } from 'react';
import Link from 'next/link';
import { wpEngine } from '@/lib/wp-engine/client';
import { WPConnectionConfig } from '@/lib/wp-engine/types';
import { serializeToWP } from '@/lib/wp-engine/gutenberg';
import { useWpEditorStore } from '@/lib/wp-engine/editor-store';

function ConnectionModal({ onClose }: { onClose: () => void }) {
  const connection = useWpEditorStore((s) => s.connection);
  const setConnection = useWpEditorStore((s) => s.setConnection);
  const setConnected = useWpEditorStore((s) => s.setConnected);
  const connecting = useWpEditorStore((s) => s.connecting);
  const setConnecting = useWpEditorStore((s) => s.setConnecting);
  const connectionError = useWpEditorStore((s) => s.connectionError);
  const setConnectionError = useWpEditorStore((s) => s.setConnectionError);

  const [url, setUrl] = useState(connection?.wpUrl || '');
  const [key, setKey] = useState(connection?.apiKey || '');

  const handleConnect = async () => {
    const config: WPConnectionConfig = { wpUrl: url.trim(), apiKey: key.trim() };
    if (!config.wpUrl || !config.apiKey) {
      setConnectionError('Enter both the site URL and API key.');
      return;
    }
    setConnecting(true);
    setConnectionError(null);
    try {
      const result = await wpEngine.checkStatus(config);
      if (result.connected) {
        setConnection(config);
        setConnected(true);
        setConnectionError(null);
        onClose();
      } else {
        setConnectionError(result.message || 'Could not connect. Is the AI Wonderland plugin active?');
      }
    } catch (err: any) {
      setConnectionError(err?.message || 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  const inputCls =
    'w-full rounded-md border border-white/10 bg-black/40 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/25';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1322] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Connect WordPress</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xs px-1">
            ✕
          </button>
        </div>
        <p className="mb-4 text-[11px] text-white/40">
          Requires the AI Wonderland plugin with a matching API key. This editor publishes Gutenberg blocks.
        </p>

        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
          WordPress Site URL
        </label>
        <input
          className={inputCls}
          placeholder="https://your-site.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <label className="mb-1 mt-3 block text-[10px] font-semibold uppercase tracking-wider text-white/40">
          API Key
        </label>
        <input
          className={inputCls}
          placeholder="X-AIW-Api-Key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        {connectionError && (
          <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">
            {connectionError}
          </p>
        )}

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Test & Connect'}
        </button>
      </div>
    </div>
  );
}

export function WpTopbar() {
  const title = useWpEditorStore((s) => s.title);
  const status = useWpEditorStore((s) => s.status);
  const setStatus = useWpEditorStore((s) => s.setStatus);
  const elements = useWpEditorStore((s) => s.elements);
  const connection = useWpEditorStore((s) => s.connection);
  const connected = useWpEditorStore((s) => s.connected);
  const setLeftOpen = useWpEditorStore((s) => s.setLeftOpen);
  const setRightOpen = useWpEditorStore((s) => s.setRightOpen);
  const leftOpen = useWpEditorStore((s) => s.leftOpen);
  const rightOpen = useWpEditorStore((s) => s.rightOpen);

  const [modalOpen, setModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handlePublish = async () => {
    if (!connection || !connected) {
      setModalOpen(true);
      return;
    }
    if (!title.trim()) {
      showToast('Add a title first.');
      return;
    }
    setPublishing(true);
    try {
      const serialized = serializeToWP(elements);
      const res = await wpEngine.publish(connection, {
        title: title.trim(),
        status,
        content: serialized.gutenberg,
        elements,
      });
      localStorage.setItem(
        'aiw-wp-editor-draft',
        JSON.stringify({ title: title.trim(), elements, status, lastPublished: new Date().toISOString() })
      );
      showToast(res.message || 'Published to WordPress');
    } catch (err: any) {
      showToast(err?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-white/10 bg-[#0b0b0d]/95 px-4 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/wonder-build" className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-violet-400">
            AI Wonderland
          </Link>
          <span className="h-4 w-px bg-white/15" />
          <p className="truncate text-xs text-white/60">WordPress Editor</p>
          <div className="hidden items-center gap-1 md:flex">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-white/50 hover:bg-white/10 hover:text-white"
            >
              Blocks
            </button>
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-white/50 hover:bg-white/10 hover:text-white"
            >
              Inspector
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'publish')}
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
            title="Publish status"
          >
            <option value="draft">Draft</option>
            <option value="publish">Publish</option>
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              connected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-white/30'}`} />
            {connected ? 'Connected' : 'Connect WP'}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg border border-white/10 bg-[#161b28] px-4 py-2 text-xs text-white shadow-2xl">
          {toast}
        </div>
      )}

      {modalOpen && <ConnectionModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
