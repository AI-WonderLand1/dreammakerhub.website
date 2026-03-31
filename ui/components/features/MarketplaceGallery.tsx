"use client";
import { useState } from 'react';
import { Download, CheckCircle, Package } from 'lucide-react';

export default function MarketplaceGallery() {
  const [installing, setInstalling] = useState<string | null>(null);
  
  // Example items - these would normally come from your MEGA/Supabase list
  const items = [
    { id: 'm1', name: 'Glass UI Kit', handle: 'mega_handle_1', desc: 'Beautiful blurred components' },
    { id: 'm2', name: 'Auth Flow', handle: 'mega_handle_2', desc: 'Pre-built login/register logic' }
  ];

  const handleInstall = async (item: any) => {
    setInstalling(item.id);
    const res = await fetch('/api/marketplace/install', {
      method: 'POST',
      body: JSON.stringify({ componentHandle: item.handle, projectId: 'current' })
    });
    
    if (res.ok) {
      alert(`${item.name} is now live in your project!`);
    }
    setInstalling(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
      {items.map(item => (
        <div key={item.id} className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-purple-500/50 transition">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
              <Package size={24} />
            </div>
            <button 
              onClick={() => handleInstall(item)}
              disabled={installing === item.id}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-purple-400 transition"
            >
              {installing === item.id ? 'Installing...' : <><Download size={14}/> Install</>}
            </button>
          </div>
          <h3 className="text-white font-bold">{item.name}</h3>
          <p className="text-white/40 text-xs mt-1">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
