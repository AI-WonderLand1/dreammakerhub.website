"use client";
import { useState, useRef } from "react";
// ... existing imports

export default function Navigation() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (label: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpenMenu(label);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpenMenu(null), 200);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10 transition-all">
      {/* ... Nav wrapper code ... */}
      
      {menuItems.map((item) => (
        <div 
          key={item.label} 
          className="relative h-16 flex items-center" 
          onMouseEnter={() => handleMouseEnter(item.label)} 
          onMouseLeave={handleMouseLeave}
        >
          <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
            {item.label} <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          
          {/* Dropdown with subtle entrance animation */}
          {openMenu === item.label && (
            <div className="absolute top-16 left-0 w-56 p-2 bg-slate-950/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-top-2">
              {item.subItems.map((sub) => (
                <Link key={sub.label} href={sub.href} className="block px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      {/* ... rest of your code ... */}
    </nav>
  );
}
