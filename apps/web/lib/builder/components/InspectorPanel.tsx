'use client';

import React, { useState, useMemo } from 'react';
import { useBuilderStore } from '../store';
import { Breakpoint } from '../types';
import { extractHeadings, checkHeadingHierarchy, checkFormLabels, getContrastRatio, getContrastGrade } from '../a11y-utils';

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors border-b border-white/5"
    >
      {label}
      <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
    </button>
  );
}

function InputRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] text-white/50 block mb-0.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/20"
      />
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] text-white/50 block mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
      >
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-white/50 block mb-0.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 rounded border border-white/10 bg-transparent cursor-pointer shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#hex or rgba()"
          className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
        />
      </div>
    </div>
  );
}

function NumberRow({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div>
      <label className="text-[10px] text-white/50 block mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
      />
    </div>
  );
}

const BREAKPOINTS: { key: Breakpoint; label: string }[] = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'wide', label: 'Wide' },
];

export default function InspectorPanel() {
  const {
    elements, selectedId, updateElementProps, updateElementStyles,
    rightPanelOpen, setRightPanelOpen, activeBreakpoint, setBreakpoint,
  } = useBuilderStore();
  const [sections, setSections] = useState<Set<string>>(new Set(['content', 'layout', 'style']));
  const selectedElement = elements.find((el) => el.id === selectedId);

  const headingIssues = useMemo(() => {
    const headings = extractHeadings(elements);
    return checkHeadingHierarchy(headings);
  }, [elements]);

  const missingFormLabels = useMemo(() => {
    return checkFormLabels(elements).filter((f) => !f.hasLabel);
  }, [elements]);

  const toggleSection = (name: string) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const setStyle = (key: string, value: string) => {
    if (selectedElement) updateElementStyles(selectedElement.id, { [key]: value });
  };
  const getStyle = (key: string) => (selectedElement?.styles as any)?.[key] || '';

  const setProp = (key: string, value: any) => {
    if (selectedElement) updateElementProps(selectedElement.id, { [key]: value });
  };
  const getProp = (key: string) => selectedElement?.props?.[key] !== undefined ? String(selectedElement.props[key]) : '';

  if (!rightPanelOpen) return null;

  if (!selectedElement) {
    return (
      <div className="w-full bg-[#0c101d] text-white/40 text-xs flex items-center justify-center text-center p-4">
        Select an element on the canvas to edit its properties.
      </div>
    );
  }

  const isOpen = (name: string) => sections.has(name);

  return (
    <div className="w-full bg-[#0c101d] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm">{selectedElement.icon}</span>
          <span className="text-xs font-semibold truncate">{selectedElement.name}</span>
        </div>
        <button onClick={() => setRightPanelOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1">✕</button>
      </div>

      {/* Responsive breakpoint switcher */}
      <div className="shrink-0 flex border-b border-white/10">
        {BREAKPOINTS.map((bp) => (
          <button
            key={bp.key}
            onClick={() => setBreakpoint(bp.key)}
            className={`flex-1 px-1 py-1 text-[9px] font-semibold transition-colors ${
              activeBreakpoint === bp.key ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/30 hover:text-white/60'
            }`}
          >
            {bp.label}
          </button>
        ))}
      </div>

      {/* Accordion sections */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Content ── */}
        <SectionHeader label="Content" open={isOpen('content')} onToggle={() => toggleSection('content')} />
        {isOpen('content') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            {selectedElement.props && Object.entries(selectedElement.props).filter(([k]) => !k.startsWith('_')).map(([key, val]) => {
              if (['icon', 'emoji'].includes(key) && typeof val === 'string' && val.length < 5) {
                return (
                  <div key={key}>
                    <label className="text-[10px] text-white/50 block mb-0.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => setProp(key, e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-lg text-white outline-none focus:border-purple-500 text-center"
                    />
                  </div>
                );
              }
              if (typeof val === 'boolean') {
                return (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-[10px] text-white/50 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <button
                      onClick={() => setProp(key, !val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${val ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {val ? 'ON' : 'OFF'}
                    </button>
                  </div>
                );
              }
              if (typeof val === 'number') {
                return (
                  <NumberRow
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    value={val}
                    onChange={(v) => setProp(key, v)}
                  />
                );
              }
              if (Array.isArray(val)) {
                return (
                  <div key={key}>
                    <label className="text-[10px] text-white/50 block mb-0.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <textarea
                      value={JSON.stringify(val, null, 2)}
                      rows={3}
                      onChange={(e) => {
                        try { setProp(key, JSON.parse(e.target.value)); } catch {}
                      }}
                      className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-white outline-none focus:border-purple-500"
                    />
                  </div>
                );
              }
              return (
                <InputRow
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  value={String(val || '')}
                  onChange={(v) => setProp(key, v)}
                />
              );
            })}
          </div>
        )}

        {/* ── Image Editor ── */}
        {['image', 'ai-image', 'avatar', 'image-hotspot', 'image-carousel', 'image-compare', 'gallery'].includes(selectedElement.type) && (
          <>
            <SectionHeader label="Image" open={isOpen('image')} onToggle={() => toggleSection('image')} />
            {isOpen('image') && (
              <div className="px-3 py-2 space-y-2 border-b border-white/5">
                <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Transform</p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberRow label="Width" value={parseInt(getStyle('width')) || 0} onChange={(v) => setStyle('width', v ? `${v}px` : '')} />
                  <NumberRow label="Height" value={parseInt(getStyle('height')) || 0} onChange={(v) => setStyle('height', v ? `${v}px` : '')} />
                </div>
                <SelectRow label="Object Fit" value={getStyle('objectFit') || ''} onChange={(v) => setStyle('objectFit', v)} options={['cover', 'contain', 'fill', 'none', 'scale-down']} />
                <SelectRow label="Object Position" value={getStyle('objectPosition') || ''} onChange={(v) => setStyle('objectPosition', v)} options={['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right']} />
                {(() => {
                  const currentFilter = getStyle('filter') || '';
                  const parseFilter = (fn: string): number => {
                    const m = currentFilter.match(new RegExp(`${fn}\\(([\\d.]+)`));
                    return m ? parseFloat(m[1]) : (fn === 'blur' ? 0 : 100);
                  };
                  const composeFilter = (fn: string, val: number): string => {
                    const parts: string[] = [];
                    const filters: [string, string, number][] = [
                      ['brightness', 'brightness', parseFilter('brightness')],
                      ['contrast', 'contrast', parseFilter('contrast')],
                      ['saturate', 'saturate', parseFilter('saturate')],
                      ['blur', 'blur', parseFilter('blur')],
                    ];
                    for (const [key, name, existing] of filters) {
                      const v = key === fn ? val : existing;
                      if (key === 'blur' && v > 0) parts.push(`blur(${v}px)`);
                      else if (key !== 'blur' && v !== 100) parts.push(`${name}(${v}%)`);
                    }
                    return parts.join(' ');
                  };
                  return (
                    <div className="border-t border-white/5 pt-2">
                      <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Filters</p>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberRow label="Brightness (%)" value={parseFilter('brightness')} min={0} max={200} onChange={(v) => setStyle('filter', composeFilter('brightness', v))} />
                        <NumberRow label="Contrast (%)" value={parseFilter('contrast')} min={0} max={200} onChange={(v) => setStyle('filter', composeFilter('contrast', v))} />
                        <NumberRow label="Saturate (%)" value={parseFilter('saturate')} min={0} max={300} onChange={(v) => setStyle('filter', composeFilter('saturate', v))} />
                        <NumberRow label="Blur (px)" value={parseFilter('blur')} min={0} max={20} onChange={(v) => setStyle('filter', composeFilter('blur', v))} />
                      </div>
                    </div>
                  );
                })()}
                <div className="border-t border-white/5 pt-2">
                  <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Preset Filters</p>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: 'Normal', value: '' },
                      { label: 'Grayscale', value: 'grayscale(100%)' },
                      { label: 'Sepia', value: 'sepia(80%)' },
                      { label: 'Invert', value: 'invert(100%)' },
                      { label: 'Vintage', value: 'sepia(50%) contrast(110%) brightness(90%)' },
                      { label: 'Cool', value: 'saturate(120%) hue-rotate(20deg) brightness(105%)' },
                      { label: 'Warm', value: 'saturate(130%) hue-rotate(-10deg) brightness(105%)' },
                      { label: 'Dramatic', value: 'contrast(130%) brightness(90%) saturate(110%)' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setStyle('filter', preset.value)}
                        className={`text-[9px] px-1 py-1.5 rounded transition-colors ${getStyle('filter') === preset.value ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 border border-transparent'}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2">
                  <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Border & Radius</p>
                  <div className="grid grid-cols-2 gap-2">
                    <InputRow label="Radius" value={getStyle('borderRadius')} onChange={(v) => setStyle('borderRadius', v)} placeholder="0.5rem" />
                    <SelectRow label="Radius Preset" value={getStyle('borderRadius')} onChange={(v) => setStyle('borderRadius', v)} options={['0', '0.25rem', '0.5rem', '0.75rem', '1rem', '9999px']} />
                  </div>
                  <SelectRow label="Border Style" value={getStyle('borderStyle') || ''} onChange={(v) => setStyle('borderStyle', v)} options={['none', 'solid', 'dashed', 'dotted', 'double']} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Video Editor ── */}
        {['video', 'video-bg', 'ai-tts'].includes(selectedElement.type) && (
          <>
            <SectionHeader label="Video" open={isOpen('video')} onToggle={() => toggleSection('video')} />
            {isOpen('video') && (
              <div className="px-3 py-2 space-y-2 border-b border-white/5">
                <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Source</p>
                <InputRow label="Video URL" value={getProp('src') || getProp('url') || ''} onChange={(v) => { setProp('src', v); setProp('url', v); }} placeholder="https://..." />
                <InputRow label="Poster Image" value={getProp('poster') || ''} onChange={(v) => setProp('poster', v)} placeholder="Thumbnail URL" />
                <div className="grid grid-cols-2 gap-2">
                  <SelectRow label="Platform" value={getProp('platform') || ''} onChange={(v) => setProp('platform', v)} options={['youtube', 'vimeo', 'self', 'dailymotion', 'twitch']} />
                  <SelectRow label="Quality" value={getProp('quality') || ''} onChange={(v) => setProp('quality', v)} options={['auto', '1080p', '720p', '480p', '360p']} />
                </div>
                <div className="border-t border-white/5 pt-2">
                  <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Playback</p>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-white/50">Autoplay</label>
                    <button
                      onClick={() => setProp('autoplay', !selectedElement.props?.autoplay)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${selectedElement.props?.autoplay ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {selectedElement.props?.autoplay ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <label className="text-[10px] text-white/50">Loop</label>
                    <button
                      onClick={() => setProp('loop', !selectedElement.props?.loop)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${selectedElement.props?.loop ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {selectedElement.props?.loop ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <label className="text-[10px] text-white/50">Muted</label>
                    <button
                      onClick={() => setProp('muted', !selectedElement.props?.muted)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${selectedElement.props?.muted ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {selectedElement.props?.muted ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <label className="text-[10px] text-white/50">Controls</label>
                    <button
                      onClick={() => setProp('controls', !selectedElement.props?.controls)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${selectedElement.props?.controls !== false ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}
                    >
                      {selectedElement.props?.controls !== false ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2">
                  <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Trim</p>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberRow label="Start (s)" value={parseInt(getProp('startTime')) || 0} min={0} onChange={(v) => setProp('startTime', v)} />
                    <NumberRow label="End (s)" value={parseInt(getProp('endTime')) || 0} min={0} onChange={(v) => setProp('endTime', v)} />
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2">
                  <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Dimensions</p>
                  <div className="grid grid-cols-2 gap-2">
                    <InputRow label="Width" value={getStyle('width')} onChange={(v) => setStyle('width', v)} placeholder="100%" />
                    <InputRow label="Height" value={getStyle('height')} onChange={(v) => setStyle('height', v)} placeholder="auto" />
                    <SelectRow label="Aspect Ratio" value={getStyle('aspectRatio') || ''} onChange={(v) => setStyle('aspectRatio', v)} options={['16/9', '4/3', '1/1', '9/16', '3/4', '21/9']} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Layout ── */}
        <SectionHeader label="Layout" open={isOpen('layout')} onToggle={() => toggleSection('layout')} />
        {isOpen('layout') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="Width" value={getStyle('width')} onChange={(v) => setStyle('width', v)} />
              <InputRow label="Height" value={getStyle('height')} onChange={(v) => setStyle('height', v)} />
              <InputRow label="Min Height" value={getStyle('minHeight')} onChange={(v) => setStyle('minHeight', v)} />
              <InputRow label="Max Width" value={getStyle('maxWidth')} onChange={(v) => setStyle('maxWidth', v)} />
            </div>
            <SelectRow label="Display" value={getStyle('display')} onChange={(v) => setStyle('display', v)} options={['block', 'flex', 'grid', 'inline', 'inline-block', 'none']} />
            {['flex', 'grid'].includes(getStyle('display')) && (
              <>
                <SelectRow label="Direction" value={getStyle('flexDirection')} onChange={(v) => setStyle('flexDirection', v)} options={['row', 'column', 'row-reverse', 'column-reverse']} />
                <SelectRow label="Align Items" value={getStyle('alignItems')} onChange={(v) => setStyle('alignItems', v)} options={['flex-start', 'center', 'flex-end', 'stretch', 'baseline']} />
                <SelectRow label="Justify" value={getStyle('justifyContent')} onChange={(v) => setStyle('justifyContent', v)} options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']} />
                <InputRow label="Gap" value={getStyle('gap')} onChange={(v) => setStyle('gap', v)} />
                <SelectRow label="Wrap" value={getStyle('flexWrap')} onChange={(v) => setStyle('flexWrap', v)} options={['nowrap', 'wrap', 'wrap-reverse']} />
                {getStyle('display') === 'grid' && (
                  <InputRow label="Grid Columns" value={getStyle('gridTemplateColumns')} onChange={(v) => setStyle('gridTemplateColumns', v)} placeholder="repeat(3, 1fr)" />
                )}
              </>
            )}
            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Spacing</p>
              <div className="grid grid-cols-2 gap-2">
                <InputRow label="Padding" value={getStyle('padding')} onChange={(v) => setStyle('padding', v)} />
                <InputRow label="Margin" value={getStyle('margin')} onChange={(v) => setStyle('margin', v)} />
                <InputRow label="Padding Top" value={getStyle('paddingTop')} onChange={(v) => setStyle('paddingTop', v)} />
                <InputRow label="Padding Bottom" value={getStyle('paddingBottom')} onChange={(v) => setStyle('paddingBottom', v)} />
                <InputRow label="Padding Left" value={getStyle('paddingLeft')} onChange={(v) => setStyle('paddingLeft', v)} />
                <InputRow label="Padding Right" value={getStyle('paddingRight')} onChange={(v) => setStyle('paddingRight', v)} />
                <InputRow label="Margin Top" value={getStyle('marginTop')} onChange={(v) => setStyle('marginTop', v)} />
                <InputRow label="Margin Bottom" value={getStyle('marginBottom')} onChange={(v) => setStyle('marginBottom', v)} />
                <InputRow label="Margin Left" value={getStyle('marginLeft')} onChange={(v) => setStyle('marginLeft', v)} />
                <InputRow label="Margin Right" value={getStyle('marginRight')} onChange={(v) => setStyle('marginRight', v)} />
              </div>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Position</p>
              <div className="grid grid-cols-2 gap-2">
                <SelectRow label="Position" value={getStyle('position')} onChange={(v) => setStyle('position', v)} options={['static', 'relative', 'absolute', 'fixed', 'sticky']} />
                <InputRow label="Z-Index" value={getStyle('zIndex')} onChange={(v) => setStyle('zIndex', v)} />
                <InputRow label="Top" value={getStyle('top')} onChange={(v) => setStyle('top', v)} />
                <InputRow label="Right" value={getStyle('right')} onChange={(v) => setStyle('right', v)} />
                <InputRow label="Bottom" value={getStyle('bottom')} onChange={(v) => setStyle('bottom', v)} />
                <InputRow label="Left" value={getStyle('left')} onChange={(v) => setStyle('left', v)} />
              </div>
            </div>
            <SelectRow label="Overflow" value={getStyle('overflow')} onChange={(v) => setStyle('overflow', v)} options={['visible', 'hidden', 'scroll', 'auto']} />
          </div>
        )}

        {/* ── Style ── */}
        <SectionHeader label="Style" open={isOpen('style')} onToggle={() => toggleSection('style')} />
        {isOpen('style') && (
          <div className="px-3 py-2 space-y-3 border-b border-white/5">
            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Colors</p>
            <ColorRow label="Text Color" value={getStyle('color')} onChange={(v) => setStyle('color', v)} />
            <ColorRow label="Background" value={getStyle('backgroundColor')} onChange={(v) => setStyle('backgroundColor', v)} />
            <ColorRow label="Border Color" value={getStyle('borderColor')} onChange={(v) => setStyle('borderColor', v)} />
            {/* Color contrast checker */}
            {(() => {
              const fg = getStyle('color');
              const bg = getStyle('backgroundColor');
              if (!fg || !bg || fg === 'transparent' || bg === 'transparent') return null;
              const ratio = getContrastRatio(fg, bg);
              const grade = getContrastGrade(ratio);
              const colors = { 'pass-aaa': 'text-green-300 bg-green-500/10', 'pass-aa': 'text-emerald-300 bg-emerald-500/10', 'fail': 'text-red-300 bg-red-500/10' };
              const labels = { 'pass-aaa': 'AAA Pass', 'pass-aa': 'AA Pass', 'fail': 'Fail' };
              return (
                <div className={`text-[10px] px-2 py-1 rounded ${colors[grade]}`}>
                  Contrast: {ratio.toFixed(1)}:1 — {labels[grade]}
                  {grade === 'fail' && ' (needs 4.5:1 for normal text)'}
                </div>
              );
            })()}

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Typography</p>
              <div className="space-y-2">
                <SelectRow label="Font Family" value={getStyle('fontFamily')} onChange={(v) => setStyle('fontFamily', v)} options={['Inter, sans-serif', 'Georgia, serif', '"Fira Code", monospace', 'Arial, sans-serif', 'system-ui, sans-serif', 'Georgia, "Times New Roman", serif']} />
                <div className="grid grid-cols-2 gap-2">
                  <InputRow label="Font Size" value={getStyle('fontSize')} onChange={(v) => setStyle('fontSize', v)} />
                  <SelectRow label="Weight" value={getStyle('fontWeight')} onChange={(v) => setStyle('fontWeight', v)} options={['100', '200', '300', '400', '500', '600', '700', '800', '900']} />
                  <InputRow label="Line Height" value={getStyle('lineHeight')} onChange={(v) => setStyle('lineHeight', v)} />
                  <InputRow label="Letter Spacing" value={getStyle('letterSpacing')} onChange={(v) => setStyle('letterSpacing', v)} />
                </div>
                <SelectRow label="Text Align" value={getStyle('textAlign')} onChange={(v) => setStyle('textAlign', v)} options={['left', 'center', 'right', 'justify']} />
                <SelectRow label="Transform" value={getStyle('textTransform')} onChange={(v) => setStyle('textTransform', v)} options={['none', 'uppercase', 'lowercase', 'capitalize']} />
                <SelectRow label="Decoration" value={getStyle('textDecoration')} onChange={(v) => setStyle('textDecoration', v)} options={['none', 'underline', 'overline', 'line-through']} />
              </div>
            </div>

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Background</p>
              <InputRow label="Bg Image URL" value={getStyle('backgroundImage')} onChange={(v) => setStyle('backgroundImage', v.startsWith('url(') ? v : `url(${v})`)} placeholder="url(...)" />
              <div className="grid grid-cols-2 gap-2">
                <SelectRow label="Bg Size" value={getStyle('backgroundSize')} onChange={(v) => setStyle('backgroundSize', v)} options={['cover', 'contain', 'auto', '100%', 'initial']} />
                <SelectRow label="Bg Position" value={getStyle('backgroundPosition')} onChange={(v) => setStyle('backgroundPosition', v)} options={['center', 'top', 'bottom', 'left', 'right', 'center center', 'center top']} />
                <SelectRow label="Bg Repeat" value={getStyle('backgroundRepeat')} onChange={(v) => setStyle('backgroundRepeat', v)} options={['no-repeat', 'repeat', 'repeat-x', 'repeat-y']} />
              </div>
            </div>

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Border</p>
              <InputRow label="Border" value={getStyle('border')} onChange={(v) => setStyle('border', v)} placeholder="1px solid rgba(255,255,255,0.1)" />
              <div className="grid grid-cols-2 gap-2">
                <InputRow label="Border Width" value={getStyle('borderWidth')} onChange={(v) => setStyle('borderWidth', v)} />
                <SelectRow label="Border Style" value={getStyle('borderStyle')} onChange={(v) => setStyle('borderStyle', v)} options={['solid', 'dashed', 'dotted', 'double', 'none']} />
              </div>
              <InputRow label="Border Radius" value={getStyle('borderRadius')} onChange={(v) => setStyle('borderRadius', v)} placeholder="0.5rem" />
            </div>

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Shadow & Opacity</p>
              <InputRow label="Box Shadow" value={getStyle('boxShadow')} onChange={(v) => setStyle('boxShadow', v)} placeholder="0 4px 12px rgba(0,0,0,0.3)" />
              <InputRow label="Opacity" value={getStyle('opacity')} onChange={(v) => setStyle('opacity', v)} placeholder="1" />
            </div>
          </div>
        )}

        {/* ── Effects ── */}
        <SectionHeader label="Effects" open={isOpen('effects')} onToggle={() => toggleSection('effects')} />
        {isOpen('effects') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Animation</p>
            <SelectRow label="Animation" value={getStyle('animationName') || ''} onChange={(v) => setStyle('animationName', v)} options={['fadeIn', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'zoomIn', 'bounce', 'pulse', 'spin', 'none']} />
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="Duration (s)" value={getStyle('animationDuration')} onChange={(v) => setStyle('animationDuration', v)} placeholder="0.3s" />
              <InputRow label="Delay (s)" value={getStyle('animationDelay')} onChange={(v) => setStyle('animationDelay', v)} placeholder="0s" />
            </div>
            <SelectRow label="Iteration" value={getStyle('animationIterationCount') || ''} onChange={(v) => setStyle('animationIterationCount', v)} options={['1', '2', '3', 'infinite']} />

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Transform</p>
              <InputRow label="Scale" value={getStyle('transformScale') || ''} onChange={(v) => setStyle('transform', v ? `scale(${v})` : '')} placeholder="1" />
              <InputRow label="Rotate (deg)" value={getStyle('transformRotate') || ''} onChange={(v) => setStyle('transform', v ? `rotate(${v}deg)` : '')} placeholder="0" />
            </div>

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Transition</p>
              <div className="grid grid-cols-2 gap-2">
                <InputRow label="Property" value={getStyle('transitionProperty') || ''} onChange={(v) => setStyle('transitionProperty', v)} placeholder="all" />
                <InputRow label="Duration (s)" value={getStyle('transitionDuration') || ''} onChange={(v) => setStyle('transitionDuration', v)} placeholder="0.3s" />
              </div>
              <SelectRow label="Timing" value={getStyle('transitionTimingFunction') || ''} onChange={(v) => setStyle('transitionTimingFunction', v)} options={['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out']} />
            </div>

            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Filter</p>
              <InputRow label="Blur (px)" value={getStyle('filterBlur') || ''} onChange={(v) => setStyle('filter', v ? `blur(${v}px)` : '')} placeholder="0" />
              <InputRow label="Brightness (%)" value={getStyle('filterBrightness') || ''} onChange={(v) => setStyle('filter', v ? `brightness(${v}%)` : '')} placeholder="100" />
            </div>
          </div>
        )}

        {/* ── Responsive ── */}
        <SectionHeader label="Responsive" open={isOpen('responsive')} onToggle={() => toggleSection('responsive')} />
        {isOpen('responsive') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/50">Current: <span className="text-purple-300 font-semibold uppercase">{activeBreakpoint}</span></span>
            </div>
            <p className="text-[10px] text-white/30 leading-relaxed">
              Device-specific overrides are applied per breakpoint. Switch breakpoints above to set different values for width, spacing, and typography per device.
            </p>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/50">Hide on this device</label>
              <button
                onClick={() => {
                  const key = `hideOn${activeBreakpoint.charAt(0).toUpperCase() + activeBreakpoint.slice(1)}`;
                  const current = selectedElement.props?.[key];
                  setProp(key, !current);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${selectedElement.props?.[`hideOn${activeBreakpoint.charAt(0).toUpperCase() + activeBreakpoint.slice(1)}`] ? 'bg-red-600/80 text-white' : 'bg-white/10 text-white/50'}`}
              >
                {selectedElement.props?.[`hideOn${activeBreakpoint.charAt(0).toUpperCase() + activeBreakpoint.slice(1)}`] ? 'Hidden' : 'Visible'}
              </button>
            </div>
          </div>
        )}

        {/* ── Advanced ── */}
        <SectionHeader label="Advanced" open={isOpen('advanced')} onToggle={() => toggleSection('advanced')} />
        {isOpen('advanced') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <InputRow label="CSS Class" value={getProp('className')} onChange={(v) => setProp('className', v)} placeholder="my-custom-class" />
            <InputRow label="ID" value={getProp('id') || getProp('htmlId') || ''} onChange={(v) => setProp('htmlId', v)} placeholder="element-id" />
            <div>
              <label className="text-[10px] text-white/50 block mb-0.5">Custom CSS</label>
              <textarea
                value={getProp('customCSS') || ''}
                onChange={(e) => setProp('customCSS', e.target.value)}
                rows={4}
                placeholder=".my-class { color: red; }"
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-white outline-none focus:border-purple-500"
              />
            </div>
            <InputRow label="ARIA Label" value={getProp('ariaLabel') || ''} onChange={(v) => setProp('ariaLabel', v)} placeholder="Descriptive label" />
            <InputRow label="HTML Attributes" value={getProp('htmlAttributes') || ''} onChange={(v) => setProp('htmlAttributes', v)} placeholder='data-custom="value"' />
          </div>
        )}

        {/* ── Interactions ── */}
        <SectionHeader label="Interactions" open={isOpen('interactions')} onToggle={() => toggleSection('interactions')} />
        {isOpen('interactions') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Click</p>
            <SelectRow label="Action" value={getProp('clickAction') || ''} onChange={(v) => setProp('clickAction', v)} options={['none', 'navigate', 'scroll-to', 'toggle-modal', 'run-js', 'webhook']} />
            {getProp('clickAction') === 'navigate' && (
              <InputRow label="URL" value={getProp('clickUrl') || ''} onChange={(v) => setProp('clickUrl', v)} placeholder="https://..." />
            )}
            {getProp('clickAction') === 'run-js' && (
              <div>
                <label className="text-[10px] text-white/50 block mb-0.5">JavaScript</label>
                <textarea
                  value={getProp('clickJs') || ''}
                  onChange={(e) => setProp('clickJs', e.target.value)}
                  rows={3}
                  placeholder="console.log('clicked')"
                  className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-mono text-white outline-none focus:border-purple-500"
                />
              </div>
            )}
            {getProp('clickAction') === 'webhook' && (
              <InputRow label="Webhook URL" value={getProp('clickWebhook') || ''} onChange={(v) => setProp('clickWebhook', v)} placeholder="https://..." />
            )}
            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Hover</p>
              <SelectRow label="Hover Effect" value={getProp('hoverEffect') || ''} onChange={(v) => setProp('hoverEffect', v)} options={['none', 'scale', 'glow', 'lift', 'darken', 'underline']} />
            </div>
            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Scroll</p>
              <SelectRow label="Scroll Effect" value={getProp('scrollEffect') || ''} onChange={(v) => setProp('scrollEffect', v)} options={['none', 'fade-in', 'slide-up', 'parallax', 'sticky']} />
            </div>
          </div>
        )}

        {/* ── Data ── */}
        <SectionHeader label="Data" open={isOpen('data')} onToggle={() => toggleSection('data')} />
        {isOpen('data') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <p className="text-[10px] text-white/30 leading-relaxed">Bind this element to WordPress dynamic data sources.</p>
            <SelectRow label="Source" value={getProp('dynamicSource') || ''} onChange={(v) => setProp('dynamicSource', v)} options={['', 'post_title', 'post_content', 'post_excerpt', 'featured_image', 'author_name', 'author_avatar', 'permalink', 'custom_field']} />
            {getProp('dynamicSource') === 'custom_field' && (
              <InputRow label="ACF / Meta Key" value={getProp('metaKey') || ''} onChange={(v) => setProp('metaKey', v)} placeholder="field_name" />
            )}
            <SelectRow label="Post Type" value={getProp('dynamicPostType') || ''} onChange={(v) => setProp('dynamicPostType', v)} options={['', 'post', 'page', 'product', 'any']} />
            <InputRow label="Fallback Text" value={getProp('dynamicFallback') || ''} onChange={(v) => setProp('dynamicFallback', v)} placeholder="Default if empty" />
          </div>
        )}

        {/* ── Visibility ── */}
        <SectionHeader label="Visibility" open={isOpen('visibility')} onToggle={() => toggleSection('visibility')} />
        {isOpen('visibility') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <SelectRow label="Show for" value={getProp('visibilityRole') || ''} onChange={(v) => setProp('visibilityRole', v)} options={['', 'all', 'logged_in', 'logged_out', 'admin', 'editor', 'subscriber']} />
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/50">Require login</label>
              <button
                onClick={() => setProp('requireLogin', !selectedElement.props?.requireLogin)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${selectedElement.props?.requireLogin ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'}`}
              >
                {selectedElement.props?.requireLogin ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="border-t border-white/5 pt-2">
              <p className="text-[9px] text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Schedule</p>
              <InputRow label="Show from" value={getProp('visibleFrom') || ''} onChange={(v) => setProp('visibleFrom', v)} placeholder="2026-01-01" />
              <InputRow label="Show until" value={getProp('visibleUntil') || ''} onChange={(v) => setProp('visibleUntil', v)} placeholder="2026-12-31" />
            </div>
          </div>
        )}

        {/* ── Accessibility & SEO ── */}
        <SectionHeader label="Accessibility & SEO" open={isOpen('accessibility')} onToggle={() => toggleSection('accessibility')} />
        {isOpen('accessibility') && (
          <div className="px-3 py-2 space-y-2 border-b border-white/5">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-white/50">Alt Text</label>
                {selectedElement?.type === 'image' && !getProp('alt') && (
                  <button
                    onClick={() => setProp('alt', 'AI-generated description of this image.')}
                    className="text-[9px] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    ✨ Generate with AI
                  </button>
                )}
              </div>
              <input
                type="text"
                value={getProp('alt') || ''}
                onChange={(e) => setProp('alt', e.target.value)}
                placeholder="Describe the image"
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/20"
              />
              {selectedElement?.type === 'image' && !getProp('alt') && (
                <p className="text-[9px] text-yellow-400/70 mt-0.5">⚠️ Missing alt text — required for accessibility</p>
              )}
            </div>
            <InputRow label="ARIA Label" value={getProp('ariaLabel') || getProp('aria-label') || ''} onChange={(v) => setProp('aria-label', v)} placeholder="Screen reader text" />
            {selectedElement?.type === 'heading' && (
              <SelectRow label="Heading Level" value={getProp('level') || ''} onChange={(v) => setProp('level', v)} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6']} />
            )}
            <div>
              <label className="text-[10px] text-white/50 block mb-0.5">Schema / Structured Data</label>
              <select
                value={getProp('schemaType') || ''}
                onChange={(e) => setProp('schemaType', e.target.value)}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="">None</option>
                <option value="Article">Article</option>
                <option value="Product">Product</option>
                <option value="FAQPage">FAQ</option>
                <option value="LocalBusiness">Local Business</option>
                <option value="Person">Person</option>
                <option value="Review">Review</option>
                <option value="Recipe">Recipe</option>
                <option value="Event">Event</option>
              </select>
            </div>

            {/* Heading hierarchy checker */}
            {headingIssues.length > 0 && (
              <div className="border-t border-white/5 pt-2">
                <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider mb-1">
                  ⚠️ Heading Hierarchy Issues
                </p>
                <div className="space-y-1">
                  {headingIssues.map((issue) => (
                    <div key={issue.id} className={`text-[10px] px-2 py-1 rounded ${issue.severity === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-yellow-500/10 text-yellow-300'}`}>
                      {issue.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form label checker */}
            {missingFormLabels.length > 0 && (
              <div className="border-t border-white/5 pt-2">
                <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider mb-1">
                  ⚠️ Missing Form Labels
                </p>
                <div className="space-y-1">
                  {missingFormLabels.map((f) => (
                    <div key={f.id} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-300">
                      {f.name} ({f.type}) — no label or aria-label found.
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-2 text-center text-[9px] text-white/20">
        {selectedElement.type} · {selectedElement.id.slice(0, 12)}…
      </div>
    </div>
  );
}
