'use client';

import React from 'react';
import { useBuilderStore } from '../store';
import { RightPanelTab } from '../types';

const STYLE_PROPS: { key: string; label: string; type: 'text' | 'color' | 'select' }[] = [
  { key: 'padding', label: 'Padding', type: 'text' },
  { key: 'margin', label: 'Margin', type: 'text' },
  { key: 'width', label: 'Width', type: 'text' },
  { key: 'height', label: 'Height', type: 'text' },
  { key: 'minHeight', label: 'Min Height', type: 'text' },
  { key: 'maxWidth', label: 'Max Width', type: 'text' },
  { key: 'borderRadius', label: 'Border Radius', type: 'text' },
  { key: 'border', label: 'Border', type: 'text' },
  { key: 'opacity', label: 'Opacity', type: 'text' },
  { key: 'overflow', label: 'Overflow', type: 'select' },
  { key: 'display', label: 'Display', type: 'select' },
];

const TYPOGRAPHY_PROPS: { key: string; label: string; type: 'text' | 'select' | 'range' }[] = [
  { key: 'fontFamily', label: 'Font Family', type: 'select' },
  { key: 'fontSize', label: 'Font Size', type: 'text' },
  { key: 'fontWeight', label: 'Font Weight', type: 'select' },
  { key: 'lineHeight', label: 'Line Height', type: 'text' },
  { key: 'letterSpacing', label: 'Letter Spacing', type: 'text' },
  { key: 'textAlign', label: 'Text Align', type: 'select' },
  { key: 'textTransform', label: 'Text Transform', type: 'select' },
  { key: 'textDecoration', label: 'Text Decoration', type: 'select' },
];

const RIGHT_TABS: { key: RightPanelTab; label: string; icon: string }[] = [
  { key: 'style', label: 'Style', icon: '🎨' },
  { key: 'typography', label: 'Text', icon: '🔤' },
  { key: 'color', label: 'Color', icon: '🎯' },
  { key: 'media', label: 'Media', icon: '🖼️' },
];

export default function InspectorPanel() {
  const {
    elements, selectedId, updateElementProps, updateElementStyles,
    rightPanelTab, setRightPanelTab, rightPanelOpen, setRightPanelOpen,
  } = useBuilderStore();
  const selectedElement = elements.find((el) => el.id === selectedId);

  if (!rightPanelOpen) return null;

  if (!selectedElement) {
    return (
      <div className="w-80 border-l border-white/10 bg-[#0c101d] text-white/40 text-xs flex items-center justify-center text-center p-4">
        Select an element on the canvas to edit its properties.
      </div>
    );
  }

  const renderStyleTab = () => (
    <div className="space-y-3">
      {STYLE_PROPS.map((prop) => {
        const value = (selectedElement.styles as any)[prop.key] || '';
        return (
          <div key={prop.key}>
            <label className="text-[10px] text-white/50 block mb-0.5">{prop.label}</label>
            {prop.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => updateElementStyles(selectedElement.id, { [prop.key]: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="">—</option>
                {prop.key === 'display' && ['block', 'flex', 'grid', 'inline', 'inline-block', 'none'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {prop.key === 'overflow' && ['visible', 'hidden', 'scroll', 'auto'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => updateElementStyles(selectedElement.id, { [prop.key]: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTypographyTab = () => (
    <div className="space-y-3">
      {TYPOGRAPHY_PROPS.map((prop) => {
        const value = (selectedElement.styles as any)[prop.key] || '';
        return (
          <div key={prop.key}>
            <label className="text-[10px] text-white/50 block mb-0.5">{prop.label}</label>
            {prop.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => updateElementStyles(selectedElement.id, { [prop.key]: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="">—</option>
                {prop.key === 'fontFamily' && ['Inter, sans-serif', 'Georgia, serif', '"Fira Code", monospace', 'Arial, sans-serif'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {prop.key === 'fontWeight' && ['100', '200', '300', '400', '500', '600', '700', '800', '900'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {prop.key === 'textAlign' && ['left', 'center', 'right', 'justify'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {prop.key === 'textTransform' && ['none', 'uppercase', 'lowercase', 'capitalize'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                {prop.key === 'textDecoration' && ['none', 'underline', 'line-through'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => updateElementStyles(selectedElement.id, { [prop.key]: e.target.value })}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderColorTab = () => (
    <div className="space-y-4">
      {[
        { key: 'color', label: 'Text Color' },
        { key: 'backgroundColor', label: 'Background' },
        { key: 'borderColor', label: 'Border Color' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-[10px] text-white/50 block mb-1">{label}</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={(selectedElement.styles as any)[key] || '#ffffff'}
              onChange={(e) => updateElementStyles(selectedElement.id, { [key]: e.target.value })}
              className="w-10 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={(selectedElement.styles as any)[key] || ''}
              onChange={(e) => updateElementStyles(selectedElement.id, { [key]: e.target.value })}
              placeholder="#hex or rgba()"
              className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderMediaTab = () => {
    const mediaProps = ['src', 'imageSrc', 'mediaSrc', 'backgroundImage', 'videoSrc', 'icon'];
    const found = mediaProps.find((p) => selectedElement.props[p] !== undefined);

    return (
      <div className="space-y-3">
        {['Image URL', 'Video URL', 'Alt Text', 'Caption'].map((label) => {
          const key = label.toLowerCase().replace(/\s+/g, '');
          const value = selectedElement.props[key] || '';
          return (
            <div key={key}>
              <label className="text-[10px] text-white/50 block mb-0.5">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => updateElementProps(selectedElement.id, { [key]: e.target.value })}
                placeholder={`Enter ${label}...`}
                className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
          );
        })}
        {found && selectedElement.props[found] && (
          <div className="mt-3 rounded-lg border border-white/10 overflow-hidden">
            {selectedElement.props[found].includes('video') || selectedElement.props[found].includes('youtube') ? (
              <div className="aspect-video bg-black/60 flex items-center justify-center text-white/30 text-xs">Video Preview</div>
            ) : (
              <img
                src={selectedElement.props[found]}
                alt="Preview"
                className="w-full h-32 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-l border-white/10 bg-[#0c101d] text-white flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 p-2">
        <span className="text-xs font-semibold truncate">{selectedElement.icon} {selectedElement.name}</span>
        <button onClick={() => setRightPanelOpen(false)} className="text-white/30 hover:text-white/70 text-xs px-1">✕</button>
      </div>

      <div className="shrink-0 flex border-b border-white/10">
        {RIGHT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRightPanelTab(tab.key)}
            className={`flex-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
              rightPanelTab === tab.key ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {rightPanelTab === 'style' && renderStyleTab()}
        {rightPanelTab === 'typography' && renderTypographyTab()}
        {rightPanelTab === 'color' && renderColorTab()}
        {rightPanelTab === 'media' && renderMediaTab()}
      </div>
    </div>
  );
}
