import React from 'react';

/**
 * @deprecated This component was specific to Theia. 
 * Transitioning to Coder-based IDE TopBar.
 */
export const IdeTopBar = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center justify-between w-full h-10 px-4 bg-[#1e1e1e] border-b border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-white/70">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Coder Sandbox Active</span>
      </div>
    </div>
  );
};

export default IdeTopBar;