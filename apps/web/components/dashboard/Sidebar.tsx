import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  Wand2, 
  Box, 
  Printer, 
  Layers, 
  Users, 
  Settings, 
  Sparkles, 
  ChevronRight,
  Gem
} from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

const NavItem = ({ icon: Icon, label, href, active }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-[#5046E6]/20 text-white border border-[#5046E6]/30' 
          : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-[#7C3AED]' : 'group-hover:text-white'}`} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

const BrandLogo = () => (
  <div className="flex items-center gap-3 px-4 py-6">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5046E6] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-purple-500/20">
      <Sparkles className="text-white w-6 h-6" />
    </div>
    <span className="text-xl font-bold text-white tracking-tight">PixelForge</span>
  </div>
);

const UpgradeCard = () => (
  <div className="m-4 p-5 rounded-2xl bg-gradient-to-br from-[#0C1020] to-[#07090E] border border-white/5 relative overflow-hidden group">
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-600/10 blur-3xl group-hover:bg-purple-600/20 transition-all duration-500" />
    <div className="flex items-center gap-2 mb-3">
      <Gem className="w-4 h-4 text-purple-400" />
      <span className="text-xs font-bold text-white uppercase tracking-wider">Upgrade to Pro</span>
    </div>
    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
      Unlock advanced 3D generation and unlimited cloud credits.
    </p>
    <button className="w-full py-2 rounded-lg bg-gradient-to-r from-[#5046E6] to-[#7C3AED] text-white text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20">
      Upgrade Now
    </button>
  </div>
);

export default function Sidebar() {
  return (
    <aside className="w-[18%] h-screen fixed left-0 top-0 bg-[#0C0E14] border-r border-white/5 flex flex-col z-40">
      <BrandLogo />
      
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <NavItem icon={Home} label="Home" href="/dashboard/ai-generator" active />
        <NavItem icon={Wand2} label="AI Tools" href="#" />
        <NavItem icon={Box} label="3D Generator" href="#" />
        <NavItem icon={Printer} label="Print Tools" href="#" />
        <NavItem icon={Layers} label="Creations" href="#" />
        <NavItem icon={Users} label="Community" href="#" />
        <NavItem icon={Settings} label="Settings" href="#" />
      </nav>

      <UpgradeCard />
    </aside>
  );
}
