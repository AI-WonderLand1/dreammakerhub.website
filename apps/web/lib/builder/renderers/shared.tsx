'use client';

import React, { useState } from 'react';

export function AccordionItem({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  const panelId = `acc-panel-${Math.random().toString(36).slice(2, 6)}`;
  const headerId = `acc-hdr-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div className="border-b border-white/10">
      <button
        id={headerId}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-white/80 hover:text-white transition-colors"
      >
        {title}
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!open}
        className="px-3 pb-2 text-[11px] text-white/50"
      >
        {content}
      </div>
    </div>
  );
}

export function TabsContainer({ tabs, ...baseProps }: { tabs: { label: string; content: string }[]; [key: string]: any }) {
  const [active, setActive] = useState(0);
  const tabListId = `tablist-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div {...baseProps}>
      <div role="tablist" aria-label="Content tabs" className="flex border-b border-white/10">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            aria-controls={`${tabListId}-panel-${i}`}
            onClick={(e) => { e.stopPropagation(); setActive(i); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); setActive((i + 1) % tabs.length); }
              if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((i - 1 + tabs.length) % tabs.length); }
            }}
            className={`px-3 py-1.5 text-[10px] font-semibold transition-colors ${
              active === i ? 'border-b-2 border-purple-500 text-purple-300' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          id={`${tabListId}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${tabListId}-tab-${i}`}
          hidden={active !== i}
          className="px-3 py-2 text-xs text-white/60"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
