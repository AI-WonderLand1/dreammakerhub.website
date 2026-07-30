'use client';

import { useState, useRef } from 'react';
import JSZip from 'jszip';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: Record<string, string>) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setImporting(true);
    setError(null);

    try {
      if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const files: Record<string, string> = {};

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir) {
            const content = await zipEntry.async('string');
            files[path] = content;
          }
        }

        onImport(files);
        onClose();
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);

        if (Array.isArray(data)) {
          onImport({ 'builder-state.json': JSON.stringify(data, null, 2) });
        } else if (typeof data === 'object') {
          onImport({ [file.name]: text });
        } else {
          setError('Invalid JSON format');
          setImporting(false);
          return;
        }
        onClose();
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        const text = await file.text();
        onImport({ [file.name]: text });
        onClose();
      } else {
        const text = await file.text();
        onImport({ [file.name]: text });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c101d] p-6 text-white shadow-2xl">
        <h2 className="text-lg font-bold">Import Files</h2>
        <p className="mt-1 text-sm text-white/50">Upload HTML, JSON, or ZIP files to import into your project.</p>

        <div
          className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-white/20 hover:border-white/40'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-white/60">
            {dragOver ? 'Drop file here' : 'Click to browse or drag and drop'}
          </p>
          <p className="mt-1 text-[10px] text-white/40">HTML, JSON, or ZIP</p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.json,.zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
