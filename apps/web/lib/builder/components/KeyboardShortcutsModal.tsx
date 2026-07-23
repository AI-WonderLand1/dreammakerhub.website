'use client';

import React, { useEffect, useRef } from 'react';
import { useBuilderStore } from '../store';

const SHORTCUTS = [
  { keys: 'Ctrl+Z', label: 'Undo' },
  { keys: 'Ctrl+Y', label: 'Redo' },
  { keys: 'Ctrl+S', label: 'Save project' },
  { keys: 'Ctrl+D', label: 'Duplicate selected element' },
  { keys: 'Delete / Backspace', label: 'Remove selected element' },
  { keys: 'Escape', label: 'Deselect element / Close panel' },
  { keys: 'Tab', label: 'Navigate between panels' },
  { keys: 'Arrow keys', label: 'Nudge selected element' },
  { keys: 'Shift+Arrow', label: 'Nudge by 10px' },
  { keys: 'Ctrl+Shift+G', label: 'Toggle grid' },
  { keys: 'Ctrl+Shift+S', label: 'Toggle snap to grid' },
  { keys: 'Ctrl+Plus / Ctrl+Minus', label: 'Zoom in / out' },
  { keys: 'Ctrl+0', label: 'Reset zoom' },
  { keys: '?', label: 'Toggle this shortcuts panel' },
];

export default function KeyboardShortcutsModal() {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useBuilderStore();
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (shortcutsModalOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      setTimeout(() => ref.current?.focus(), 0);
    } else if (previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [shortcutsModalOpen]);

  useEffect(() => {
    if (!shortcutsModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShortcutsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcutsModalOpen, setShortcutsModalOpen]);

  if (!shortcutsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setShortcutsModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setShortcutsModalOpen(false);
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-sm font-bold text-white">⌨️ Keyboard Shortcuts</h2>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="text-white/40 hover:text-white/80 text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Close shortcuts"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-1">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5"
            >
              <span className="text-xs text-white/60">{s.label}</span>
              <kbd className="text-[10px] font-mono bg-black/50 text-purple-300 px-2 py-0.5 rounded border border-white/10">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 px-5 py-2 text-center text-[10px] text-white/30">
          Press <kbd className="text-[10px] font-mono bg-black/50 text-purple-300 px-1.5 py-0.5 rounded border border-white/10">?</kbd> to toggle this panel
        </div>
      </div>
    </div>
  );
}
