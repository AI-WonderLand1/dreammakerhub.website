'use client';

import { useEffect } from 'react';

const NPC_SIM_URL = 'https://npc-ai-sim.dreammakerhub.website';

export default function WonderPlayPage() {
  useEffect(() => {
    window.location.replace(NPC_SIM_URL);
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#05070c] px-6 text-center text-white">
      <div>
        <p className="text-lg font-bold">Opening NPC-AI-SIM…</p>
        <p className="mt-2 text-sm text-white/50">Redirecting to the NPC workspace.</p>
        <a href={NPC_SIM_URL} className="mt-5 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
          Open NPC-AI-SIM
        </a>
      </div>
    </main>
  );
}
