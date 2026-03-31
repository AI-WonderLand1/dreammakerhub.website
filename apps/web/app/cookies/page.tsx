"use client";

import { ShieldCheck, Cookie, BarChart3, ToggleLeft } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">WONDERSPACE</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Cookie Policy</h1>
          <p className="max-w-3xl text-slate-300">
            How we use cookies and local storage to keep sessions secure, remember preferences, and measure product
            usage.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Cookie className="h-4 w-4 text-sky-300" />
              Essential
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Session cookies for auth, CSRF protection, and maintaining project context in Playground and Wonder-Build.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <BarChart3 className="h-4 w-4 text-sky-300" />
              Analytics
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Privacy-first analytics to understand feature adoption—no cross-site tracking, no sale of data.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <ToggleLeft className="h-4 w-4 text-sky-300" />
              Preferences
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Local storage for theme, module filters, and layout choices—cleared when you reset settings.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Controls</p>
              <h2 className="text-xl font-semibold text-slate-50">How to manage cookies</h2>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Disable non-essential cookies in your browser to limit analytics storage.</li>
            <li>Use private browsing to avoid persisting local preferences.</li>
            <li>Contact support for data deletion requests tied to your account.</li>
          </ul>
          <p className="mt-4 text-sm text-slate-400">
            We periodically update this policy as we add or change storage mechanisms. Significant changes are announced
            in the blog and release notes.
          </p>
        </section>
      </div>
    </div>
  );
}
