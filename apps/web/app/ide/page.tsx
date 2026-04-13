'use client';

import dynamic from 'next/dynamic';

const WonderSpaceIDE = dynamic(() => import('@/components/engines/WonderSpaceIDE'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-blue-400 font-mono text-sm">Booting WonderSpace IDE...</p>
        <p className="text-gray-600 text-xs">Initializing WebContainer runtime</p>
      </div>
    </div>
  ),
});

export default function WonderSpaceIDEPage() {
  return <WonderSpaceIDE />;
}
