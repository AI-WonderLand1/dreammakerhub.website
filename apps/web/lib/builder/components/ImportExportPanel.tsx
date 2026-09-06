'use client';

import React, { useState, useRef, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useBuilderStore } from '../store';
import { parseHtmlToElements, isHtmlString } from '../html-parser';

export default function ImportExportPanel() {
  const { elements, setElements } = useBuilderStore();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'html'>('json');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExport = useCallback(() => {
    if (elements.length === 0) return;
    let content: string;
    let filename: string;
    let mime: string;

    if (exportFormat === 'json') {
      content = JSON.stringify(elements, null, 2);
      filename = 'builder-export.json';
      mime = 'application/json';
    } else {
      content = elementsToHtml(elements);
      filename = 'builder-export.html';
      mime = 'text/html';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus(`✅ Exported as ${exportFormat.toUpperCase()}`);
    setTimeout(() => setImportStatus(null), 2000);
  }, [elements, exportFormat]);

  const elementsToHtml = (els: typeof elements, depth = 0): string => {
    const indent = '  '.repeat(depth);
    return els.map((el) => {
      const styleStr = el.styles ? Object.entries(el.styles).filter(([, v]) => v).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ') : '';
      const styleAttr = styleStr ? ` style="${styleStr}"` : '';
      const classAttr = ` class="builder-el-${el.type}"`;
      const inner = el.children ? '\n' + elementsToHtml(el.children, depth + 1) + '\n' + indent : '';

      switch (el.type) {
        case 'heading': {
          const tag = el.props?.level || 'h2';
          return `${indent}<${tag}${styleAttr}${classAttr}>${el.props?.content || ''}${inner}</${tag}>`;
        }
        case 'paragraph':
          return `${indent}<p${styleAttr}${classAttr}>${el.props?.content || ''}${inner}</p>`;
        case 'image':
          return `${indent}<img src="${el.props?.src || ''}" alt="${el.props?.alt || ''}"${styleAttr}${classAttr} />${inner}`;
        case 'button':
          return `${indent}<a href="${el.props?.url || '#'}"${styleAttr}${classAttr}>${el.props?.label || 'Button'}${inner}</a>`;
        case 'divider':
        case 'separator':
          return `${indent}<hr${styleAttr}${classAttr} />`;
        case 'spacer':
          return `${indent}<div${styleAttr}${classAttr}></div>`;
        case 'custom-html':
          return `${indent}${el.props?.html || ''}`;
        default:
          return `${indent}<div data-type="${el.type}" data-name="${el.name}"${styleAttr}${classAttr}>${el.props?.content || el.props?.title || ''}${inner}</div>`;
      }
    }).join('\n');
  };

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      tryParseAndImport(text, file.name);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleImportText = useCallback(() => {
    setImportError(null);
    setImportStatus(null);
    const text = textareaRef.current?.value;
    if (!text?.trim()) return;
    tryParseAndImport(text, 'paste');
  }, []);

  const tryParseAndImport = (text: string, source: string) => {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setElements(parsed);
        setImportStatus(`✅ Imported ${parsed.length} element(s) from JSON`);
      } else if (parsed.elements) {
        setElements(parsed.elements);
        setImportStatus(`✅ Imported ${parsed.elements.length} element(s)`);
      } else {
        setImportError('Invalid format: expected an array of elements or { elements: [...] }');
      }
    } catch {
      if (isHtmlString(text)) {
        try {
          const sanitizedHtml = DOMPurify.sanitize(text, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'link', 'meta'],
            FORBID_ATTR: ['srcdoc'],
            ALLOW_DATA_ATTR: false,
          });
          const parsed = parseHtmlToElements(sanitizedHtml);
          if (parsed.length > 0) {
            setElements(parsed);
            setImportStatus(`✅ Imported ${parsed.length} element(s) from HTML`);
            return;
          }
        } catch {
          setImportError('Could not parse as HTML. Try JSON format instead.');
          return;
        }
      }
      setImportError('Could not parse as JSON or HTML. Make sure the file is valid.');
    }
  };

  return (
    <div className="w-full bg-[#0c101d] text-white flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📦</span>
          <span className="text-xs font-semibold">Import / Export</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-white/10">
        <button
          onClick={() => setTab('export')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold transition-colors ${tab === 'export' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'}`}
        >
          📤 Export
        </button>
        <button
          onClick={() => setTab('import')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-semibold transition-colors ${tab === 'import' ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'}`}
        >
          📥 Import
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'export' && (
          <>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Export your page to save or transfer it. Choose a format and download.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-colors border ${exportFormat === 'json' ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' : 'bg-white/5 text-white/40 hover:text-white/70 border-white/10'}`}
              >
                <span className="block text-sm mb-0.5">📋</span>
                JSON
              </button>
              <button
                onClick={() => setExportFormat('html')}
                className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-semibold transition-colors border ${exportFormat === 'html' ? 'bg-purple-600/20 text-purple-300 border-purple-500/50' : 'bg-white/5 text-white/40 hover:text-white/70 border-white/10'}`}
              >
                <span className="block text-sm mb-0.5">🌐</span>
                HTML
              </button>
            </div>

            <button
              onClick={handleExport}
              disabled={elements.length === 0}
              className="w-full rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {elements.length === 0 ? 'Nothing to export' : `Download ${exportFormat.toUpperCase()} (${elements.length} blocks)`}
            </button>

            {elements.length > 0 && (
              <details className="text-[10px]">
                <summary className="text-white/30 cursor-pointer hover:text-white/50 transition-colors">Preview export</summary>
                <pre className="mt-1 p-2 bg-black/40 rounded border border-white/5 text-[9px] text-white/30 font-mono max-h-32 overflow-auto whitespace-pre-wrap">
                  {exportFormat === 'json'
                    ? JSON.stringify(elements.slice(0, 3), null, 2) + (elements.length > 3 ? `\n\n... and ${elements.length - 3} more blocks` : '')
                    : elementsToHtml(elements.slice(0, 3)) + (elements.length > 3 ? `\n\n<!-- ... and ${elements.length - 3} more blocks -->` : '')
                  }
                </pre>
              </details>
            )}
          </>
        )}

        {tab === 'import' && (
          <>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Import a previously exported builder JSON file or paste JSON/HTML directly. This will replace all current elements.
            </p>

            <div className="space-y-2">
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Upload File</p>
              <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors">
                <span className="text-lg">📂</span>
                <span className="text-[10px] text-white/40">Click to select .json or .html file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.html,.htm"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Or Paste Content</p>
              <textarea
                ref={textareaRef}
                rows={6}
                placeholder='Paste JSON or HTML here...'
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono text-white outline-none focus:border-purple-500 placeholder:text-white/20"
              />
              <button
                onClick={handleImportText}
                className="w-full mt-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Import
              </button>
            </div>

            {importError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[10px] text-red-300">
                ❌ {importError}
              </div>
            )}

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1 font-semibold uppercase tracking-wider">Format Guide</p>
              <div className="text-[9px] text-white/20 leading-relaxed space-y-0.5">
                <p><span className="text-white/40">JSON:</span> Array of element objects</p>
                <p><span className="text-white/40">HTML:</span> Parsed into blocks automatically</p>
                <p className="text-purple-400/60">Existing elements will be replaced.</p>
              </div>
            </div>
          </>
        )}

        {importStatus && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-[10px] text-emerald-300 text-center">
            {importStatus}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 p-2 text-center text-[9px] text-white/20">
        {elements.length} block{elements.length !== 1 ? 's' : ''} on canvas
      </div>
    </div>
  );
}
