'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import signMap from "./homepage-sign-map.json";
import { BUILDER_SHOWCASE_CARDS, toSafeInternalHref } from "./builder-showcase-cards";
import { HOMEPAGE_SIGN_LINKS } from "./homepage-links";
import InteractiveSignpost from "./InteractiveSignpost";
import ShowcaseSection from "./ShowcaseSection";
import AIDiagram from "./AIDiagram";
import HomepageNavbar from "./HomepageNavbar";
import PricingSection from "./PricingSection";
import ComparisonTable from "./ComparisonTable";
import FeatureShowcase from "@/components/homepage/FeatureShowcase";
import NpcCtaSection from "@/components/homepage/NpcCtaSection";
import { PLANS, REGISTRY_ITEMS } from "./data";

const openSpiritGuide = () => {
  const assistantButton = document.querySelector('button[aria-label="Open AI Assistant"]');
  if (assistantButton) {
    (assistantButton as HTMLElement).click();
    return;
  }
  const aiButtons = document.querySelectorAll('button');
  for (const button of aiButtons) {
    const label = button.getAttribute('aria-label') || button.textContent || '';
    if (label.toLowerCase().includes('ai') || label.toLowerCase().includes('assistant') || label.includes('🔮')) {
      (button as HTMLElement).click();
      return;
    }
  }
  window.location.href = '/wonder-build/ai-builder';
};

export default function Homepage() {
  const isAuthenticated = Boolean(useAuth().user);
  const destinationNames = signMap.map((link) => link.label).join(", ");
  const iframeLabel = `WonderPlay Landing Page destinations: ${destinationNames}`;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    return (
      <main className="relative min-h-screen" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        <HomepageNavbar scrolled={scrolled} />
        <FeatureShowcase />
        <NpcCtaSection />

        <section className="relative w-full overflow-hidden" style={{ minHeight: "100svh" }}>
<Image
           src="/images/wonderland-background.png"
           alt="WonderPlay Landing Page - A whimsical wonderland forest scene with a wooden signpost pointing toward different paths"
           fill
           priority
           className="object-cover object-left"
           sizes="100vw"
         />
<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 z-10">
          {HOMEPAGE_SIGN_LINKS && (
            <InteractiveSignpost iframeLabel={iframeLabel} heroMode />
          )}
        </div>
        <div className="relative z-20 flex min-h-[100svh] flex-col justify-between px-6 pb-10 pt-24 sm:px-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-400">
                <span className="text-sm font-extrabold tracking-tight text-white">Wonderland</span>
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                Where your imagination<br className="hidden sm:block" /> comes to life
              </h1>
              <p className="mt-4 max-w-lg text-sm text-white/70 drop-shadow sm:text-base">
                Build websites and 3D games — no coding required.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300/80">
                <span className="text-lg">🔮</span>
                <span>Spirit Guide AI assistant available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ShowcaseSection />

      <section className="relative mx-auto -mt-16 w-full max-w-4xl px-6">
        <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-lg shadow-2xl shadow-purple-900/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 Ready to Create?</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Start building your 3D world in seconds. No experience needed.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link href="/template_futuristic_city"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-900/30 group relative">
                🏙️ Start with Futuristic City
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-purple-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  Pre-built futuristic city scene with neon lights and skyscrapers
                </div>
              </Link>
              <Link href="/wonder-build/playcanvas"
                className="px-6 py-3 border border-white/20 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition group relative">
                🎨 Start from Scratch
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-white/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  Blank canvas - build anything you imagine from the ground up
                </div>
              </Link>
              <Link href="/wonder-build/spatial"
                className="px-6 py-3 border border-cyan-500/30 bg-cyan-500/10 rounded-lg text-white font-semibold hover:bg-cyan-500/20 transition group relative">
                🌌 Spatial Designer
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-cyan-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  3D spatial workspace - design, collaborate, and explore in real-time
                </div>
              </Link>
              <Link href="/wonder-build/ai-builder"
                className="px-6 py-3 border border-green-500/30 bg-green-500/10 rounded-lg text-white font-semibold hover:bg-green-500/20 transition group relative">
                🤖 WonderBuild
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-green-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  Describe what you want — three AI agents build it automatically
                </div>
              </Link>
              <a href="/wonder-build/agent"
                className="px-6 py-3 border border-purple-500/30 bg-purple-500/10 rounded-lg text-white font-semibold hover:bg-purple-500/20 transition group relative">
                🎮 WonderBuild
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 border border-purple-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56">
                  Build anything with AI — websites, 3D games, and interactive experiences
                </div>
              </a>
            </div>
            <p className="text-white/40 text-sm mt-4">💡 Hover over buttons to see what they do</p>
          </div>
        </div>
      </section>

      <section id="builder-showcase" className="mx-auto mt-8 w-full max-w-7xl px-6 sm:px-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl shadow-cyan-900/20 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white">Builder Showcase</h2>
          <p className="mt-2 text-sm text-white/70">These are snapshots of the engines in action. Each card opens the builder experience so you can continue the flow immediately.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {BUILDER_SHOWCASE_CARDS.map((card) => (
              <Link key={card.title} href={toSafeInternalHref(card.href)}
                className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/80 p-3 transition duration-300 hover:border-cyan-400/80 hover:bg-slate-900">
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-700/60">
                  <Image src={card.image} alt={`${card.title} screenshot`} fill className="object-cover opacity-95 transition duration-300 group-hover:scale-105 group-hover:opacity-100" sizes="(max-width: 768px) 320px, 600px" />
                </div>
                <div className="mt-3">
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{card.desc}</p>
                  <span className="mt-2 inline-flex items-center text-xs font-semibold text-cyan-300">Open builder →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isAuthenticated && (
        <section className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-black px-6 py-10 sm:px-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/4 translate-x-1/4 rounded-full bg-emerald-600/20 blur-[80px]" />
          <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">Premium Feature</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Cloud Development Workspace</h2>
              <p className="mt-1 max-w-xl text-sm text-gray-400">
                Get your own cloud development environment with VS Code, pre-configured for Wonderland projects.
                Available for Pro and Elite subscribers.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["VS Code in Browser", "Pre-configured Wonderland", "Git Integration", "Terminal Access"].map((tag) => (
                  <span key={tag} className="rounded-full bg-emerald-900/40 border border-emerald-500/20 px-3 py-0.5 text-xs text-emerald-300">{tag}</span>
                ))}
              </div>
            </div>
            <Link href="/coder-workspace"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500">
              💻 Open Workspace
            </Link>
          </div>
        </section>
      )}

      <section id="features" className="relative mx-auto mt-10 w-full max-w-6xl px-6 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Extension Registry</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Plug-in anything. Extend everything.</h2>
            <p className="mt-1 text-sm text-gray-400">Curated extensions that plug into Playground and Wonder-Build.</p>
          </div>
          <Link href="/marketplace"
            className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition">
            Browse All →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REGISTRY_ITEMS.map((item) => (
            <Link key={item.name} href="/marketplace"
              className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-500/30 hover:bg-white/[0.06]">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">{item.name}</p>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/40">{item.tag}</span>
                </div>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PricingSection plans={PLANS} />
      <ComparisonTable />
      <AIDiagram />

      <section className="relative mx-auto mt-12 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-10 sm:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Powerful <span className="text-blue-500">WonderPlay</span> 3D Integration
          </h2>
          <p className="mx-auto mb-6 max-w-xl text-sm text-gray-400">
            Seamless real-time 3D editing and high-performance gameplay directly in the browser.
          </p>
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-xl">
              <video autoPlay muted loop playsInline className="aspect-video h-full w-full object-cover opacity-90">
                <source src="/images/PlayCanvas-Features-TheEditor-CBR4.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-md">
                Live Editor Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 mb-16 w-full max-w-6xl px-6 text-center sm:px-8">
        <p className="text-sm text-white/30 mb-4">
          Already have an account?{" "}
          <Link href="/public-pages/auth" className="text-purple-400 hover:text-purple-300 transition">Sign in</Link>
          {" · "}
          <Link href="/subscription" className="text-purple-400 hover:text-purple-300 transition">View plans</Link>
          {" · "}
          <Link href="/marketplace" className="text-cyan-400 hover:text-cyan-300 transition">Browse registry</Link>
        </p>
      </section>
    </main>
  );
}
