'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WonderBuildTemplate, WonderBuildElement, ViewportMode } from '../types';
import {
  Monitor,
  Tablet,
  Smartphone,
  MousePointer,
  Layers,
  Edit3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  Rocket,
} from 'lucide-react';

interface VisualRendererProps {
  template: WonderBuildTemplate;
  selectedElementPath?: number[];
  onSelectElement?: (path: number[], element: WonderBuildElement) => void;
  viewportMode: ViewportMode;
  setViewportMode: (mode: ViewportMode) => void;
  onOpenInspector?: () => void;
  onOpenDeployModal?: () => void;
}

export const VisualRenderer: React.FC<VisualRendererProps> = ({
  template,
  selectedElementPath = [],
  onSelectElement,
  viewportMode,
  setViewportMode,
  onOpenInspector,
  onOpenDeployModal,
}) => {
  const [inspectMode, setInspectMode] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [canvasBgDark, setCanvasBgDark] = useState(true);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Determine width based on viewport
  const getViewportWidthClass = () => {
    switch (viewportMode) {
      case 'tablet':
        return 'w-[768px] my-6 rounded-2xl shadow-2xl border-8 border-slate-800';
      case 'mobile':
        return 'w-[375px] my-6 rounded-3xl shadow-2xl border-8 border-slate-800';
      case 'desktop':
      default:
        return 'w-full max-w-[1280px] my-4 rounded-xl shadow-xl border border-slate-800';
    }
  };

  const handleInteractiveClick = (element: WonderBuildElement) => {
    const label = element.content || element.type || 'Element';
    setActionNotification(`Interactive Action Triggered: "${label}"`);
    setTimeout(() => {
      setActionNotification(null);
    }, 2500);
  };

  // Recursive element renderer
  const renderElement = (
    element: WonderBuildElement,
    path: number[] = [],
    keyIdx: number = 0
  ) => {
    if (!element) return null;

    const isSelected =
      selectedElementPath.length > 0 &&
      selectedElementPath.length === path.length &&
      selectedElementPath.every((val, index) => val === path[index]);

    const inlineStyles: React.CSSProperties = {
      ...(element.styles as React.CSSProperties),
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (inspectMode && onSelectElement) {
        onSelectElement(path, element);
      } else {
        handleInteractiveClick(element);
      }
    };

    const elementKey = `el-${path.join('-')}-${keyIdx}`;

    const outlineClasses = inspectMode
      ? isSelected
        ? 'outline-2 outline-indigo-500 outline-offset-2 relative ring-2 ring-indigo-400 group/selected'
        : 'hover:outline-1 hover:outline-dashed hover:outline-indigo-400/80 cursor-pointer group/hover'
      : 'hover:opacity-95 transition-opacity cursor-pointer';

    // Element Inspector Badge
    const renderBadge = (tag: string) => {
      if (!inspectMode || !isSelected) return null;
      return (
        <span className="absolute -top-3 left-2 z-30 bg-indigo-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow-md pointer-events-none uppercase tracking-wider">
          {tag}
        </span>
      );
    };

    // Convert element type to Framer Motion JSX component with micro-interactions
    switch (element.type) {
      case 'nav':
        return (
          <motion.nav
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('NAV')}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.nav>
        );

      case 'section':
        return (
          <motion.section
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('SECTION')}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.section>
        );

      case 'grid':
        return (
          <motion.div
            key={elementKey}
            layout
            style={{
              display: 'grid',
              ...inlineStyles,
            }}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('GRID')}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.div>
        );

      case 'card':
        return (
          <motion.div
            key={elementKey}
            layout
            whileHover={inspectMode ? {} : { y: -4, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('CARD')}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.div>
        );

      case 'div':
        return (
          <motion.div
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('DIV')}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.div>
        );

      case 'heading':
        return (
          <motion.h2
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('HEADING')}
            {element.content}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.h2>
        );

      case 'text':
        return (
          <motion.p
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('TEXT')}
            {element.content}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.p>
        );

      case 'button':
        return (
          <motion.button
            key={elementKey}
            layout
            whileHover={inspectMode ? {} : { scale: 1.05, filter: 'brightness(1.1)' }}
            whileTap={inspectMode ? {} : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            style={{ cursor: 'pointer', ...inlineStyles }}
            onClick={handleClick}
            className={`transition-all shadow-sm ${outlineClasses}`}
          >
            {renderBadge('BUTTON')}
            {element.content}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.button>
        );

      case 'image':
        return (
          <motion.div
            key={elementKey}
            layout
            whileHover={inspectMode ? {} : { scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative inline-block max-w-full"
          >
            {renderBadge('IMAGE')}
            <img
              src={element.src || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'}
              alt={element.alt || 'Template visual element'}
              style={inlineStyles}
              onClick={handleClick}
              referrerPolicy="no-referrer"
              className={`transition-all max-w-full h-auto rounded-lg shadow-sm ${outlineClasses}`}
            />
          </motion.div>
        );

      case 'footer':
        return (
          <motion.footer
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('FOOTER')}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.footer>
        );

      default:
        return (
          <motion.div
            key={elementKey}
            layout
            style={inlineStyles}
            onClick={handleClick}
            className={`transition-all ${outlineClasses}`}
          >
            {renderBadge('CONTAINER')}
            {element.content}
            {element.children?.map((child, idx) =>
              renderElement(child, [...path, idx], idx)
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>{template.name}</span>
          </span>
          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
            {template.category}
          </span>
          {template.variant && (
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded hidden sm:inline">
              {template.variant}
            </span>
          )}
        </div>

        {/* Viewport Switcher & Zoom Controls */}
        <div className="flex items-center space-x-3">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-indigo-300 w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Viewport Mode */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="vp-desktop"
              onClick={() => setViewportMode('desktop')}
              title="Desktop View (1280px)"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewportMode === 'desktop'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              id="vp-tablet"
              onClick={() => setViewportMode('tablet')}
              title="Tablet View (768px)"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewportMode === 'tablet'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              id="vp-mobile"
              onClick={() => setViewportMode('mobile')}
              title="Mobile View (375px)"
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewportMode === 'mobile'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas Background toggle */}
          <button
            onClick={() => setCanvasBgDark(!canvasBgDark)}
            title="Toggle Canvas Dark/Light Backdrop"
            className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-colors"
          >
            {canvasBgDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Inspector Toggle, Style Inspector & Deploy Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setInspectMode(!inspectMode)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              inspectMode
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>{inspectMode ? 'Inspect Mode' : 'Live Interactive Mode'}</span>
          </button>

          {onOpenDeployModal && (
            <button
              id="btn-deploy-renderer-top"
              onClick={onOpenDeployModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Deploy App</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Toast Notification */}
      <AnimatePresence>
        {actionNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 border border-indigo-400"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>{actionNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Canvas Area */}
      <div
        className={`flex-1 overflow-y-auto flex justify-center p-6 items-start transition-colors duration-300 ${
          canvasBgDark
            ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
            : 'bg-slate-200'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={template.id}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
            className={`bg-white text-slate-900 transition-all duration-300 overflow-hidden ${getViewportWidthClass()}`}
          >
            {template.elements.map((element, idx) =>
              renderElement(element, [idx], idx)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

