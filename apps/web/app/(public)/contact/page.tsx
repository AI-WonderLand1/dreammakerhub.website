"use client";

import { Mail, MessageCircle, ShieldCheck, Sparkles, Headphones } from "lucide-react";
import { logger } from '@/lib/logger';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">WONDERSPACE</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">Get in touch</h1>
          <p className="max-w-2xl text-slate-300">
            Reach the team for support, partnerships, general questions, or security disclosures. We respond within one business day.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Headphones className="h-4 w-4 text-sky-300" />
              Support
            </div>
            <p className="mt-2 text-sm text-slate-300">Product help, billing questions, refunds, or account issues.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:support@dreammakerhub.website">
              support@dreammakerhub.website
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Business & Partnerships
            </div>
            <p className="mt-2 text-sm text-slate-300">Integrations, partnerships, enterprise pilots, or business inquiries.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:contact@dreammakerhub.website">
              contact@dreammakerhub.website
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              Security
            </div>
            <p className="mt-2 text-sm text-slate-300">Report vulnerabilities or request a security review.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:security@dreammakerhub.website">
              security@dreammakerhub.website
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-inner shadow-sky-500/5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Mail className="h-4 w-4 text-sky-300" />
              General
            </div>
            <p className="mt-2 text-sm text-slate-300">General questions, feedback, pricing, roadmap, or speaking inquiries.</p>
            <a className="mt-3 inline-flex text-sm text-sky-200 hover:text-sky-100" href="mailto:hello@dreammakerhub.website">
              hello@dreammakerhub.website
            </a>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Response policy</p>
              <h2 className="text-xl font-semibold text-slate-50">What to expect</h2>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Support requests: acknowledgement as soon as possible, with updates within one business day.</li>
            <li>Security reports: triage within 24 hours and coordinated disclosure where applicable.</li>
            <li>Business and partnership inquiries: responses within two business days.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
