'use client';

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Cloud, CreditCard, Download, X, ArrowRight } from "lucide-react";

interface TempStorageWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToPlatform: () => void;
  onConnectCloud: () => void;
  onExport: () => void;
  hoursRemaining?: number;
}

export function TempStorageWarning({
  isOpen,
  onClose,
  onSaveToPlatform,
  onConnectCloud,
  onExport,
  hoursRemaining = 24,
}: TempStorageWarningProps) {
  const [timeLeft, setTimeLeft] = useState(hoursRemaining);

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 3600000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (hours: number) => {
    if (hours >= 24) return "24 hours";
    if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return "Less than 1 hour";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a0a10] border border-amber-500/30 rounded-2xl max-w-md w-full mx-4 shadow-2xl shadow-amber-500/10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Temp Storage Warning</h3>
              <p className="text-sm text-amber-400/80">Will be deleted soon</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Time remaining: {formatTime(timeLeft)}</span>
            </div>
            <p className="text-sm text-white/60">
              This project is stored in temporary storage and will be automatically deleted.
              Save to platform or connect your own cloud to keep it.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onSaveToPlatform}
              className="w-full flex items-center gap-3 p-4 bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Save to Platform</p>
                <p className="text-xs text-white/60">Keep project on our servers</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </button>

            <button
              onClick={onConnectCloud}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Connect Own Cloud</p>
                <p className="text-xs text-white/60">S3, GCS, Azure, or custom</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </button>

            <button
              onClick={onExport}
              className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Export Files</p>
                <p className="text-xs text-white/60">Download and use elsewhere</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TempStorageBadge({ hoursRemaining = 24 }: { hoursRemaining?: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-medium text-amber-300">
      <Clock className="w-3 h-3" />
      <span>{hoursRemaining}h left</span>
    </div>
  );
}
