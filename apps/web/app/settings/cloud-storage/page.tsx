"use client";

import Link from "next/link";
import { logger } from '@/lib/logger';

const PROVIDERS = [
  { name: "Supabase Storage", desc: "Connect your Supabase project for file storage" },
  { name: "AWS S3", desc: "Use Amazon S3 buckets for asset storage" },
  { name: "GCP Cloud Storage", desc: "Use Google Cloud Storage for assets" },
];

export default function CloudStoragePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard/settings" className="text-white/50 hover:text-white text-sm">&larr; Settings</Link>
          <h1 className="text-3xl font-bold mt-2">Cloud Storage</h1>
          <p className="text-white/50 mt-2">Connect your own cloud storage provider for project files and assets.</p>
        </div>

        <div className="space-y-4">
          {PROVIDERS.map((provider) => (
            <div key={provider.name} className="rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors">
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              <p className="text-white/50 mt-1 text-sm">{provider.desc}</p>
              <button className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors">
                Connect
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          <h3 className="text-lg font-semibold mb-2">Data Layers</h3>
          <p className="text-white/50 text-sm mb-4">Understand which data stays on our servers and which goes to your cloud.</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5"><span>Auth & metadata</span><span className="text-violet-400">WonderSpace</span></div>
            <div className="flex justify-between py-2 border-b border-white/5"><span>Project files (GLB, images, scenes)</span><span className="text-cyan-400">Your Cloud</span></div>
            <div className="flex justify-between py-2 border-b border-white/5"><span>AI generation</span><span className="text-violet-400">WonderSpace</span></div>
            <div className="flex justify-between py-2"><span>Editor & Runtime</span><span className="text-violet-400">WonderSpace</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}