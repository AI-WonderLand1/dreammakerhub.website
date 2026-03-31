'use client';

import { useRouter } from 'next/navigation';

export default function Topbar() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-semibold text-white">Wonder Build</p>
      <button
        type="button"
        onClick={() => router.push('/wonder-build/puck')}
        className="inline-flex h-9 items-center rounded-lg bg-cyan-500 px-3 text-xs font-bold text-black"
      >
        Open Puck Layouts
      </button>
    </div>
  );
}
