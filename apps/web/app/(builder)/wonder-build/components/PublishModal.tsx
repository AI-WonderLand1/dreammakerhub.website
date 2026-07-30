'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/lib/builder/store';
import { useSovereignOS } from '../context/SovereignOSContext';
import { logger } from '@/lib/logger';

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
  const { editorCode } = useSovereignOS();
  const { elements } = useBuilderStore();
  const [target, setTarget] = useState<'site' | 'html' | 'json'>('site');
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      if (target === 'html') {
        const html = editorCode || generateHTML(elements);
        downloadFile(html, 'export.html', 'text/html');
        setResult({ ok: true, message: 'HTML file downloaded' });
        setPublishing(false);
        return;
      }

      if (target === 'json') {
        const json = JSON.stringify(elements, null, 2);
        downloadFile(json, 'export.json', 'application/json');
        setResult({ ok: true, message: 'JSON file downloaded' });
        setPublishing(false);
        return;
      }

      const res = await fetch('/api/projects/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'site',
          code: editorCode || '',
          elements,
        }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message || (res.ok ? 'Published successfully' : 'Publish failed') });
    } catch (err: any) {
      setResult({ ok: false, message: err.message || 'Publish failed' });
    } finally {
      setPublishing(false);
    }
  };

  const buttonLabel = publishing
    ? 'Publishing...'
    : target === 'site'
      ? 'Publish to Site'
      : target === 'html'
        ? 'Export HTML'
        : 'Export JSON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c101d] p-6 text-white shadow-2xl">
        <h2 className="text-lg font-bold">Publish</h2>
        <p className="mt-1 text-sm text-white/50">Publish to your site or export your project as HTML or JSON.</p>

        <div className="mt-4 flex gap-2 rounded-lg border border-white/10 p-1">
          {([
            { key: 'site' as const, label: '🚀 Publish to Site' },
            { key: 'html' as const, label: '📄 HTML Export' },
            { key: 'json' as const, label: '📦 JSON Export' },
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
