'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBuilderStore } from '@/lib/builder/store';
import { useSovereignOS } from '../context/SovereignOSContext';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PublishModal({ isOpen, onClose }: PublishModalProps) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const { editorCode } = useSovereignOS();
  const { elements, pages, activePageId, theme } = useBuilderStore();
  const [target, setTarget] = useState<'site' | 'html' | 'json'>('site');
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; url?: string } | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      if (target === 'html') {
        const html = editorCode || generateHTML(elements);
        downloadFile(html, 'export.html', 'text/html');
        setResult({ ok: true, message: 'Active page HTML downloaded' });
        return;
      }

      if (target === 'json') {
        const json = JSON.stringify({
          version: 2,
          pages,
          activePageId,
          elements,
          theme,
        }, null, 2);
        downloadFile(json, 'wonderbuild-site.json', 'application/json');
        setResult({ ok: true, message: `Site JSON downloaded (${pages.length} page${pages.length === 1 ? '' : 's'})` });
        return;
      }

      if (!projectId) {
        setResult({ ok: false, message: 'Save this as a project before publishing the site.' });
        return;
      }

      const res = await fetch('/api/projects/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'site',
          projectId,
          pages,
          activePageId,
          theme,
        }),
      });
      const data = await res.json();
      setResult({
        ok: res.ok,
        message: data.message || (res.ok ? 'Published successfully' : 'Publish failed'),
        url: typeof data.url === 'string' ? data.url : undefined,
      });
    } catch (err: any) {
      setResult({ ok: false, message: err.message || 'Publish failed' });
    } finally {
      setPublishing(false);
    }
  };

  const buttonLabel = publishing
    ? 'Publishing...'
    : target === 'site'
      ? `Publish ${pages.length} Page${pages.length === 1 ? '' : 's'}`
      : target === 'html'
        ? 'Export Active Page HTML'
        : 'Export Site JSON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c101d] p-6 text-white shadow-2xl">
        <h2 className="text-lg font-bold">Publish</h2>
        <p className="mt-1 text-sm text-white/50">
          Publish every WonderBuild page in this project, or export the current site state.
        </p>

        {target === 'site' && (
          <div className="mt-4 rounded-xl border border-violet-400/15 bg-violet-500/[.06] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-white/70">Pages ready</span>
              <span className="rounded bg-violet-400/10 px-2 py-0.5 text-[10px] font-black text-violet-200">
                {pages.length}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">
              Page names, slugs, separate canvas content, and the project theme are published from the existing WonderBuild state.
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2 rounded-lg border border-white/10 p-1">
          {([
            { key: 'site' as const, label: '🚀 Publish Site' },
            { key: 'html' as const, label: '📄 Active HTML' },
            { key: 'json' as const, label: '📦 Site JSON' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTarget(key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                target === key ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {result && (
          <div className={`mt-4 rounded-lg px-3 py-2 text-xs font-semibold ${
            result.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'
          }`}>
            <div>{result.message}</div>
            {result.ok && result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-block text-[10px] font-bold text-green-200 underline underline-offset-2 hover:text-white"
              >
                Open published site ↗
              </a>
            )}
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
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function generateHTML(elements: any[]): string {
  const body = elements
    .map((el) => {
      const style = Object.entries(el.styles || {})
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');
      const tag = el.type === 'button' ? 'button' : el.type === 'heading' ? 'h2' : 'div';
      return `<${tag} class="builder-el type-${el.type}" style="${style}">${el.props?.label || el.props?.text || el.name || ''}</${tag}>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="bg-white text-gray-900 p-8">
${body}
</body>
</html>`;
}
