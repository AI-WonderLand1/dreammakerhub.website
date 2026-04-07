'use client';

import { useEffect, useState } from 'react';
import { Code2, Loader2 } from 'lucide-react';

interface CoderIDEEngineProps {
  engineState?: any;
  onStateChange?: (state: any) => void;
}

export default function CoderIDEEngine({ engineState, onStateChange }: CoderIDEEngineProps) {
  const [loading, setLoading] = useState(true);
  const [coderUrl, setCoderUrl] = useState<string | null>(null);

  useEffect(() => {
    const coderHost = process.env.NEXT_PUBLIC_CODER_URL || 'https://coder.com';
    const workspace = engineState?.workspace || 'wonderland';
    setCoderUrl(`${coderHost}/@wonderingtribe/${workspace}`);
    setLoading(false);
  }, [engineState]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a10]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-white/60">Loading Coder IDE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a10]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-black/60 px-4 py-2">
        <Code2 className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium text-white">Coder IDE</span>
        <span className="text-xs text-white/40 ml-auto">Cloud IDE</span>
      </div>
      <div className="flex-1">
        {coderUrl ? (
          <iframe
            src={coderUrl}
            className="h-full w-full border-0"
            allow="clipboard-read; clipboard-write"
            title="Coder IDE"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Code2 className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/60">Coder IDE not configured</p>
              <p className="text-sm text-white/40">
                Set NEXT_PUBLIC_CODER_URL in your environment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
