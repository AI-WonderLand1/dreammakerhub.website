"use client";

import { AlertTriangle, Info, Lightbulb, X } from "lucide-react";
import { logger } from '@/lib/logger';

interface Confession {
  message: string;
  type: "uncertainty" | "correction" | "limitation" | "success";
  onDismiss: () => void;
}

const CONFESSION_CONFIG = {
  uncertainty: {
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    label: "AI Uncertainty"
  },
  correction: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    label: "Correction"
  },
  limitation: {
    icon: Lightbulb,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    label: "Limitation Noted"
  },
  success: {
    icon: Info,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    label: "Note"
  }
};

export function ConfessionsOverlay({ message, type = "uncertainty", onDismiss }: Confession) {
  const config = CONFESSION_CONFIG[type] || CONFESSION_CONFIG.uncertainty;
  const Icon = config.icon;

  return (
    <div className={`fixed bottom-20 left-6 z-50 max-w-sm rounded-xl border p-4 ${config.bg} backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${config.color} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] uppercase tracking-wider ${config.color} font-semibold mb-1`}>
            {config.label}
          </p>
          <p className="text-sm text-white/80 leading-relaxed">{message}</p>
        </div>
        <button onClick={onDismiss} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}