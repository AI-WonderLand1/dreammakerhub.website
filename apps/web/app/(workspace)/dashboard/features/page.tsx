"use client";

import React from "react";
import Link from "next/link";

const FEATURES: Array<{ name: string; free: string; pro: string }> = [
  { name: "Website Builder", free: "✓", pro: "✓" },
  { name: "Mobile App Builder", free: "—", pro: "✓" },
  { name: "AI Generation", free: "Limited", pro: "Unlimited" },
  { name: "Project Import/Export", free: "✓", pro: "✓" },
  { name: "Custom Domains", free: "—", pro: "✓" },
  { name: "Team Collaboration", free: "—", pro: "✓" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#070718] to-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
              Settings
            </div>
            <h1 className="mt-2 text-3xl font-extrabold">Features</h1>
            <div className="mt-2 text-white/55">
              What you get on each plan (UI-only for now).
            </div>
          </div>

          <Link
            href="/dashboard"
            className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-bold text-white/80 inline-flex items-center"
          >
            ← Back
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-black uppercase tracking-widest text-white/70">
            Plan Comparison
          </div>

          <table className="w-full text-sm">
            <thead className="bg-transparent">
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-white/70">Feature</th>
                <th className="px-4 py-3 text-white/70">Free</th>
                <th className="px-4 py-3 text-white/70">Pro</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.name} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white/80">{f.name}</td>
                  <td className="px-4 py-3 text-center text-white/60">{f.free}</td>
                  <td className="px-4 py-3 text-center text-cyan-200">{f.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-white/40">
          Next step: connect this to your real subscription state and enforce gates in API routes.
        </div>
      </div>
    </div>
  );
}
