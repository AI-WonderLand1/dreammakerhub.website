'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const IDE_TEMPLATES = [
  {
    id: 'webcontainer',
    name: 'WonderSpace IDE',
    description: 'Browser-based IDE with WebContainer runtime',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
    href: '/ide/webcontainer',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'coder',
    name: 'Coder Workspace',
    description: 'Full cloud development environment with VS Code',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    href: 'https://coder.dreammakerhub.website',
    external: true,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'playground',
    name: 'AI Playground',
    description: 'Test AI models and prompts',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
    ),
    href: '/playground',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'wonder-build',
    name: 'Wonder-Build',
    description: 'Visual 3D canvas editor',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    ),
    href: '/wonder-build',
    color: 'from-orange-500 to-amber-500',
  },
];

export default function IDETemplateSelector() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">IDE</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Select an integrated development environment that matches your workflow
          </p>
        </div>

        {/* IDE Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {IDE_TEMPLATES.map((template) => (
            <Link
              key={template.id}
              href={template.href}
              {...(template.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${template.color} mb-6`}>
                <div className="text-white">
                  {template.icon}
                </div>
              </div>

              {/* Content */}
              <h2 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors">
                {template.name}
              </h2>
              <p className="text-white/50 text-sm mb-4">
                {template.description}
              </p>

              {/* Arrow */}
              <div className="flex items-center gap-2 text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {template.external ? 'Open in new tab' : 'Launch IDE'}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Coder Status */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Coder Workspace</span>
              <span className="text-green-400 text-sm ml-auto">Ready</span>
            </div>
            <p className="text-white/50 text-sm">
              Cloud-based development environment with VS Code, full terminal access, and persistent storage.
              Your workspace includes 1 CPU, 2GB RAM, and auto-stops after 4 hours of inactivity.
            </p>
            <Link
              href="https://coder.dreammakerhub.website"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm transition-colors"
            >
              Open Coder Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
