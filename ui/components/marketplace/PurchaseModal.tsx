
"use client";
import React from 'react';
import { CreditCard, Sparkles, X } from 'lucide-react';

interface PurchaseProps {
  handle: string;
  price: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PurchaseModal({ handle, price, onClose, onConfirm }: PurchaseProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-1 rounded-[2.5rem] bg-gradient-to-b from-cyan-500 to-purple-600">
        <div className="bg-black rounded-[2.4rem] p-8 space-y-6">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20}/></button>
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-purple-500/20 rounded-2xl text-purple-400 mb-2">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter italic">Unlock {handle}</h2>
            <p className="text-white/40 text-xs">Integrate professional AI reasoning into your local core.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center">
            <span className="text-white/60 font-mono tracking-widest text-sm uppercase">License Fee</span>
            <span className="text-2xl font-bold text-cyan-400">${price}</span>
          </div>

          <button 
            onClick={onConfirm}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group"
          >
            <CreditCard size={18} />
            Confirm Purchase
          </button>
          
          <p className="text-[9px] text-center text-white/20 uppercase tracking-widest">
            Instant Deployment via Marketplace Agent
          </p>
        </div>
      </div>
    </div>
  );
}

