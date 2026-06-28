'use client';

import React from 'react';
import { Coins, Plus, Gift } from 'lucide-react';

interface StatusBadgeProps {
  count: number;
}

const StatusBadge = ({ count }: StatusBadgeProps) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
    </span>
    <span className="text-xs font-medium text-emerald-400">{count.toLocaleString()} online</span>
  </div>
);

interface WalletWidgetProps {
  amount: string;
}

const WalletWidget = ({ amount }: WalletWidgetProps) => (
  <div className="flex items-center gap-3 bg-[#131722] border border-white/5 rounded-full pl-3 pr-1 py-1">
    <div className="flex items-center gap-2">
      <Coins className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-bold text-white mr-2">{amount}</span>
    </div>
    <button className="p-1 rounded-full hover:bg-white/5 transition-colors">
      <Plus className="w-4 h-4 text-white/60" />
    </button>
  </div>
);

const Avatar = ({ initials }: { initials: string }) => (
  <div className="w-9 h-9 rounded-full bg-[#121622] flex items-center justify-center border border-white/10">
    <span className="text-xs font-bold text-white">{initials}</span>
  </div>
);

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 py-4 px-0 mb-8">
      <StatusBadge count={1242} />
      
      <WalletWidget amount="11,256" />

      <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-white/70 text-xs font-semibold hover:bg-white/10 hover:text-white transition-all">
        <Gift className="w-4 h-4" />
        Get Credits
      </button>

      <Avatar initials="JS" />
    </header>
  );
}
