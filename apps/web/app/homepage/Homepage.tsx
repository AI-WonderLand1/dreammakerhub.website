'use client';

import MockupHomepage from './MockupHomepage';

export default function Homepage() {
  return (
    <div className="relative">
      <MockupHomepage />
      <a
        href="https://playground.dreammakerhub.website/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open AI Playground in a new tab"
        className="absolute right-4 top-[72px] z-30 inline-flex min-h-9 items-center rounded-xl border border-cyan-300/40 bg-slate-950/85 px-3 py-2 text-xs font-bold text-cyan-100 shadow-lg backdrop-blur-md transition hover:border-cyan-200 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:right-8 lg:right-10"
      >
        AI Playground ↗
      </a>
    </div>
  );
}
