"use client";

import { Monitor, Tablet, Smartphone, Maximize2 } from "lucide-react";
import { logger } from '@/lib/logger';

export type Breakpoint = "desktop" | "tablet" | "mobile";

interface BreakpointSwitcherProps {
  current: Breakpoint;
  onChange: (bp: Breakpoint) => void;
  onToggleGrid?: () => void;
  gridEnabled?: boolean;
}

export const breakpointDimensions: Record<Breakpoint, { width: number; label: string }> = {
  desktop: { width: 100, label: "Desktop" },
  tablet: { width: 768, label: "Tablet" },
  mobile: { width: 375, label: "Mobile" },
};

export function BreakpointSwitcher({ current, onChange, onToggleGrid, gridEnabled }: BreakpointSwitcherProps) {
  const items: { key: Breakpoint; icon: React.ElementType }[] = [
    { key: "desktop", icon: Monitor },
    { key: "tablet", icon: Tablet },
    { key: "mobile", icon: Smartphone },
  ];

  return (
    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
      {items.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            current === key
              ? "bg-violet-600 text-white shadow-sm"
              : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </button>
      ))}
      {onToggleGrid && (
        <div className="w-px h-4 bg-white/10 mx-1" />
      )}
      {onToggleGrid && (
        <button
          onClick={onToggleGrid}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            gridEnabled
              ? "bg-emerald-600/30 text-emerald-400"
              : "text-white/50 hover:text-white"
          }`}
          title="Toggle grid overlay"
        >
          <Maximize2 className="w-3 h-3" />
          Grid
        </button>
      )}
    </div>
  );
}
