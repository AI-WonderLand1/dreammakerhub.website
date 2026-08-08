'use client';
import React, { useState, useEffect } from 'react';
import { WonderBuildElement, ElementType } from '../types';
import {
  PRESET_THEME_LIBRARY,
  SPACING_SCALE_PRESETS,
  FONT_PAIRING_PRESETS,
  ThemePreset,
} from '../data/presetThemes';
import {
  X,
  Type,
  Palette,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sliders,
  Check,
  Sparkles,
  Maximize2,
  Layers,
  Wand2,
} from 'lucide-react';

interface ElementEditorProps {
  element: WonderBuildElement | null;
  elementPath: number[];
  onUpdateElement: (path: number[], updated: WonderBuildElement) => void;
  onDeleteElement: (path: number[]) => void;
  onAddChildElement: (path: number[], childType: ElementType) => void;
  onApplyThemeToTemplate?: (theme: ThemePreset) => void;
  onClose: () => void;
}

export const ElementEditor: React.FC<ElementEditorProps> = ({
  element,
  elementPath,
  onUpdateElement,
  onDeleteElement,
  onAddChildElement,
  onApplyThemeToTemplate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'themes'>('themes');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light' | 'vibrant' | 'editorial' | 'minimal'>('all');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  if (!element) {
    return (
      <div className="bg-slate-900 border-l border-slate-800 w-full sm:w-80 p-6 text-slate-400 text-xs flex flex-col items-center justify-center text-center space-y-3">
        <Sliders className="w-8 h-8 text-slate-600" />
        <p className="font-semibold text-slate-300">No Element Selected</p>
        <p>Click on any section, text, button, or card in the visual renderer to edit its content and apply pre-defined theme styles.</p>
      </div>
    );
  }

  // Local state for live form editing
  const [content, setContent] = useState(element.content || '');
  const [src, setSrc] = useState(element.src || '');
  const [alt, setAlt] = useState(element.alt || '');

  // Extract common styles
  const styles = (element.styles || {}) as Record<string, any>;
  const [bgColor, setBgColor] = useState(styles.backgroundColor || '#ffffff');
  const [textColor, setTextColor] = useState(styles.color || '#000000');
  const [fontSize, setFontSize] = useState(styles.fontSize || '16px');
  const [fontFamily, setFontFamily] = useState(styles.fontFamily || 'sans-serif');
  const [padding, setPadding] = useState(styles.padding || '16px');
  const [borderRadius, setBorderRadius] = useState(styles.borderRadius || '0px');

  useEffect(() => {
    setContent(element.content || '');
    setSrc(element.src || '');
    setAlt(element.alt || '');

    const currentStyles = (element.styles || {}) as Record<string, any>;
    setBgColor(currentStyles.backgroundColor || '');
    setTextColor(currentStyles.color || '');
    setFontSize(currentStyles.fontSize || '');
    setFontFamily(currentStyles.fontFamily || '');
    setPadding(currentStyles.padding || '');
    setBorderRadius(currentStyles.borderRadius || '');
  }, [element, elementPath]);

  const showToast = (msg: string) => {
    setAppliedNotification(msg);
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  const handleApplyChanges = () => {
    const updatedStyles = {
      ...element.styles,
    } as Record<string, any>;

    if (bgColor) updatedStyles.backgroundColor = bgColor;
    if (textColor) updatedStyles.color = textColor;
    if (fontSize) updatedStyles.fontSize = fontSize;
    if (fontFamily) updatedStyles.fontFamily = fontFamily;
    if (padding) updatedStyles.padding = padding;
    if (borderRadius) updatedStyles.borderRadius = borderRadius;

    const updated: WonderBuildElement = {
      ...element,
      content: content,
      src: element.type === 'image' ? src : element.src,
      alt: element.type === 'image' ? alt : element.alt,
      styles: updatedStyles,
    };

    onUpdateElement(elementPath, updated);
    showToast('Applied styles to element!');
  };

  // Apply a Theme Preset to the selected element
  const handleApplyThemeToElement = (theme: ThemePreset) => {
    const newStyles: Record<string, any> = {
      ...element.styles,
      ...theme.styles,
    };

    // Keep type-specific sensible adjustments
    if (element.type === 'button' && theme.childStyles) {
      newStyles.backgroundColor = theme.childStyles.buttonBg;
      newStyles.color = theme.childStyles.buttonText;
    } else if (element.type === 'heading' && theme.childStyles) {
      newStyles.color = theme.childStyles.headingColor;
    }

    setBgColor(newStyles.backgroundColor || '');
    setTextColor(newStyles.color || '');
    if (newStyles.fontFamily) setFontFamily(newStyles.fontFamily);
    if (newStyles.padding) setPadding(newStyles.padding);
    if (newStyles.borderRadius) setBorderRadius(newStyles.borderRadius);

    const updated: WonderBuildElement = {
      ...element,
      styles: newStyles,
    };

    onUpdateElement(elementPath, updated);
    showToast(`Applied "${theme.name}" to element`);
  };

  // Apply Font Pairing
  const handleApplyFont = (fontVal: string) => {
    setFontFamily(fontVal);
    const updatedStyles = {
      ...element.styles,
      fontFamily: fontVal,
    };
    onUpdateElement(elementPath, { ...element, styles: updatedStyles });
    showToast('Font pairing applied!');
  };

  // Apply Spacing Scale
  const handleApplySpacing = (padVal: string, radVal: string) => {
    setPadding(padVal);
    setBorderRadius(radVal);
    const updatedStyles = {
      ...element.styles,
      padding: padVal,
      borderRadius: radVal,
    };
    onUpdateElement(elementPath, { ...element, styles: updatedStyles });
    showToast('Spacing scale applied!');
  };

  const filteredThemes = PRESET_THEME_LIBRARY.filter(
    (t) => themeFilter === 'all' || t.category === themeFilter
  );

  return (
    <div className="bg-slate-900 border-l border-slate-800 w-full sm:w-80 flex flex-col h-full text-white text-xs overflow-y-auto">
      {/* Toast Notification Banner */}
      {appliedNotification && (
        <div className="bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 text-[11px] text-center flex items-center justify-center space-x-1 animate-pulse sticky top-0 z-20">
          <Check className="w-3.5 h-3.5" />
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase font-bold">
            {element.type} Node
          </span>
          <h3 className="font-bold text-sm text-white mt-1">Element Inspector</h3>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-950 border-b border-slate-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('themes')}
          className={`py-2 flex items-center justify-center space-x-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'themes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-indigo-200" />
          <span>Theme Library</span>
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`py-2 flex items-center justify-center space-x-1.5 rounded-md transition-all cursor-pointer ${
            activeTab === 'properties'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Style Properties</span>
        </button>
      </div>

      {/* Editor Controls */}
      <div className="p-4 space-y-5 flex-1">
        {/* TAB 1: PRE-DEFINED THEMES LIBRARY */}
        {activeTab === 'themes' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-slate-200 text-xs flex items-center space-x-1.5 mb-1">
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pre-Defined Theme Styles</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Click any theme to style this element or transform the entire layout.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'dark', 'light', 'vibrant', 'editorial', 'minimal'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setThemeFilter(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium transition-colors cursor-pointer ${
                    themeFilter === cat
                      ? 'bg-indigo-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Themes Cards List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 rounded-xl p-3 space-y-2 transition-all hover:bg-slate-950"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{theme.name}</span>
                    <div className="flex items-center space-x-1">
                      {theme.swatches.map((color, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: color }}
                          className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    {theme.description}
                  </p>

                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleApplyThemeToElement(theme)}
                      className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold py-1 px-2 rounded text-[10px] transition-all cursor-pointer text-center"
                    >
                      Apply to Element
                    </button>

                    {onApplyThemeToTemplate && (
                      <button
                        onClick={() => {
                          onApplyThemeToTemplate(theme);
                          showToast(`Applied "${theme.name}" to whole template!`);
                        }}
                        title="Apply palette & typography to all nodes in template"
                        className="bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 font-semibold py-1 px-2 rounded text-[10px] transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Apply All</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Font Pairings */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[11px] text-slate-300 font-bold flex items-center space-x-1">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                <span>Font Pairings</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {FONT_PAIRING_PRESETS.map((fp) => (
                  <button
                    key={fp.name}
                    onClick={() => handleApplyFont(fp.font)}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded text-left flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="text-[11px] text-slate-300">{fp.name}</span>
                    <span
                      style={{ fontFamily: fp.font }}
                      className="text-xs text-indigo-400 font-medium"
                    >
                      Aa Bb
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing Scales */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[11px] text-slate-300 font-bold flex items-center space-x-1">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spacing & Scale Presets</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SPACING_SCALE_PRESETS.map((sp) => (
                  <button
                    key={sp.name}
                    onClick={() => handleApplySpacing(sp.padding, sp.borderRadius)}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded text-left text-[11px] text-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-indigo-300">{sp.name}</div>
                    <div className="text-[9px] text-slate-500">{sp.padding}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL PROPERTY CONTROLS */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {/* Text Content */}
            {['heading', 'text', 'button'].includes(element.type) && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold flex items-center space-x-1">
                  <Type className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Text Content</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Image Fields */}
            {element.type === 'image' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Image Source (URL)</span>
                  </label>
                  <input
                    type="text"
                    value={src}
                    onChange={(e) => setSrc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Alt Description</label>
                  <input
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Style Property Fields */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="font-bold text-slate-300 text-xs flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>Style Properties (camelCase)</span>
              </h4>

              {/* Color fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Background</label>
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#ffffff or transparent"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Text Color</label>
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="#000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400">Font Size</label>
                  <input
                    type="text"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    placeholder="16px"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Padding</label>
                  <input
                    type="text"
                    value={padding}
                    onChange={(e) => setPadding(e.target.value)}
                    placeholder="20px 40px"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Font Family</label>
                <input
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="Inter, sans-serif"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Border Radius</label>
                <input
                  type="text"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  placeholder="8px"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 mt-1"
                />
              </div>
            </div>

            {/* Apply Changes Button */}
            <button
              onClick={handleApplyChanges}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Apply Changes to Element</span>
            </button>
          </div>
        )}

        {/* Add Child Node section */}
        {['section', 'div', 'grid', 'card', 'nav', 'footer'].includes(element.type) && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <label className="text-slate-400 font-semibold flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Child Element</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['heading', 'text', 'button', 'card', 'image'] as ElementType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onAddChildElement(elementPath, t);
                    showToast(`Added child ${t}`);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded text-[11px] font-medium text-slate-300 hover:text-white text-left transition-colors cursor-pointer"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete Element Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => onDeleteElement(elementPath)}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected Element</span>
          </button>
        </div>
      </div>
    </div>
  );
};
