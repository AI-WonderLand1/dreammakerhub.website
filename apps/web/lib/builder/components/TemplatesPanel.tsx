'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBuilderStore } from '../store';
import { CanvasElement } from '../types';

interface Template {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  createdAt: string;
}

export default function TemplatesPanel() {
  const { elements, setElements, addElement } = useBuilderStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load templates from localStorage and API
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');

    const local: Template[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('aiw-template-')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              local.push(JSON.parse(raw));
            } catch {}
          }
        }
      }
    } catch {}

    // Try API
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        const apiTemplates = (data.templates || []).map((t: any) => ({
          id: t.id,
          name: t.name || 'Untitled',
          description: t.description || '',
          elements: t.elements || [],
          createdAt: t.createdAt || new Date().toISOString(),
        }));
        setTemplates([...apiTemplates, ...local]);
        setLoading(false);
        return;
      }
    } catch {}

    setTemplates(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSave = useCallback(async () => {
    if (!templateName.trim() || elements.length === 0) return;
    setSaving(true);
    const template: Template = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      description: `${elements.length} block${elements.length !== 1 ? 's' : ''}`,
      elements,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`aiw-template-${template.id}`, JSON.stringify(template));

    // Try API save
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: template.name, elements: template.elements }),
      });
    } catch {}

    setTemplateName('');
    setShowSave(false);
    setSaving(false);
    loadTemplates();
  }, [templateName, elements, loadTemplates]);

  const handleLoad = useCallback((template: Template) => {
    setElements(template.elements);
  }, [setElements]);

  const handleDelete = useCallback((id: string) => {
    localStorage.removeItem(`aiw-template-${id}`);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="flex flex-col h-full w-72 bg-[#0b0f19] text-white">
      <div className="shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Templates</h3>
          <button
            onClick={() => setShowSave(true)}
            disabled={elements.length === 0}
            className="rounded bg-purple-600/80 hover:bg-purple-600 disabled:opacity-30 text-white px-2 py-0.5 text-[10px] font-semibold transition-colors"
          >
            + Save
          </button>
        </div>
        {showSave && (
          <div className="flex gap-1">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white outline-none focus:border-purple-500 placeholder:text-white/20"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
              className="rounded bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-30 text-white px-2 py-1 text-[10px] font-semibold transition-colors"
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="text-center py-8 text-xs text-white/30">Loading templates...</div>
        )}
        {!loading && templates.length === 0 && (
          <div className="text-center py-8 text-xs text-white/30">
            No saved templates yet.
            <br />
            Build something and save it!
          </div>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:border-purple-500/30 transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/80 truncate">{t.name}</p>
              <p className="text-[10px] text-white/30 truncate">{t.description}</p>
              <p className="text-[9px] text-white/20 mt-0.5">
                {new Date(t.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleLoad(t)}
                className="px-1.5 py-0.5 rounded text-[9px] text-purple-400 hover:bg-purple-500/10 transition-colors"
                title="Load template"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="px-1.5 py-0.5 rounded text-[9px] text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete template"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/10 p-2 text-center text-[10px] text-white/20">
        {templates.length} template{templates.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
