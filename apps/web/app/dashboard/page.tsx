import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome back to PixelForge.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0F131C] border border-[#1D2433] text-white">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Credits</h3>
          <p className="text-2xl font-bold mt-2">11,256</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#0F131C] border border-[#1D2433] text-white">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Projects</h3>
          <p className="text-2xl font-bold mt-2">12</p>
        </div>
        <div className="p-6 rounded-2xl bg-[#0F131C] border border-[#1D2433] text-white">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Generation Speed</h3>
          <p className="text-2xl font-bold mt-2">Fast</p>
        </div>
      </div>
    </div>
  );
}
