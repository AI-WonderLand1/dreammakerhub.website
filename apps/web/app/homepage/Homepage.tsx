'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@lib/supabase/auth-context";
import signMap from "./homepage-sign-map.json";
import { BUILDER_SHOWCASE_CARDS, toSafeInternalHref } from "./builder-showcase-cards";
import { HOMEPAGE_SIGN_LINKS } from "./homepage-links";
import InteractiveSignpost from "./InteractiveSignpost";
import AIChat from "./AIChat";

// Spirit Guide helper function
const openSpiritGuide = () => {
  // Method 1: Look for UniversalAIAssistant button by aria-label
  const assistantButton = document.querySelector('button[aria-label="Open AI Assistant"]');
  if (assistantButton) {
    (assistantButton as HTMLElement).click();
    return;
  }
  
  // Method 2: Look for any AI assistant button
  const aiButtons = document.querySelectorAll('button');
  for (const button of aiButtons) {
    const label = button.getAttribute('aria-label') || button.textContent || '';
    if (label.toLowerCase().includes('ai') || label.toLowerCase().includes('assistant') || label.includes('🔮')) {
      (button as HTMLElement).click();
      return;
    }
  }
  
  // Method 3: Fallback - redirect to AI builder
  window.location.href = '/wonder-build/ai-builder';
};

const PLANS = [
  {
    id: "free",
    name: "The Nomad",
    tier: "Free",
    price: "$0",
    period: "/forever",
    desc: "Every adventure begins somewhere. Wander in, no credit card required.",
    bullets: ["1 active project", "Basic Puck UI builder", "5 AI chats per day", "Community support", "dreammakerhub.website subdomain"],
    cta: "Start Wandering, It's Free",
    href: "/public-pages/auth",
    highlight: false,
    icon: "🌿",
  },
  {
    id: "pro",
    name: "The Architect",
    tier: "Pro",
    price: "$35",
    period: "/mo",
    desc: "For builders who are serious about shipping. Full creative power, one subscription.",
    bullets: ["5 active projects", "Unlimited AI chats", "Full 3D engine (PlayCanvas + WebGL Studio)", "WonderSpace Cloud IDE", "Egyptian Voice Module", "1-click deployment", "Custom domain included", "Accessibility tools for all creators", "Priority email support"],
    cta: "Become an Architect",
    href: "/subscription",
    highlight: true,
    icon: "⭐",
  },
  {
    id: "team",
    name: "The Guild",
    tier: "Team",
    price: "$149",
    period: "/mo",
    desc: "Built for agencies and studios who ship together. Collaborate, iterate, and deliver, without the chaos.",
    bullets: ["Everything in Pro", "Up to 5 team seats", "Shared asset library", "3 AI agent seats", "Collaborative IDE workspace", "Always-on runners (no hibernation)", "White-label ready", "300K Compute Credits/mo included"],
    cta: "Build With Your Guild",
    href: "/subscription",
    highlight: false,
    icon: "🏢",
  },
  {
    id: "enterprise",
    name: "The Architect of Worlds",
    tier: "Enterprise",
    price: "Custom",
    period: "",
    desc: "You're not building a site. You're building infrastructure. We'll build it with you.",
    bullets: ["Unlimited everything", "SSO + SCIM directory sync", "On-premise or private cloud deployment", "Custom AI agent training (your brand voice, your rules)", "Git-sync (GitHub / Bitbucket)", "Data isolation & multi-tenancy", "Accessibility compliance support (WCAG 2.1)", "Dedicated account manager", "SLA-backed uptime", "Custom Compute Credits package"],
    cta: "Talk to Us",
    href: "/contact",
    highlight: false,
    icon: "🌐",
  },
];

const REGISTRY_ITEMS = [
  { icon: "📝", name: "Changelog Writer", desc: "Auto-generate changelogs from commits", tag: "Productivity" },
  { icon: "🛡", name: "Schema Guard", desc: "Validate and enforce DB schemas", tag: "Database" },
  { icon: "🎨", name: "Design Tokens", desc: "Sync Figma tokens to your codebase", tag: "Design" },
  { icon: "🤖", name: "AI Reviewer", desc: "Constitutional AI code review agent", tag: "AI" },
  { icon: "🚀", name: "Deploy Runner", desc: "One-click cloud deploy pipeline", tag: "DevOps" },
  { icon: "🔍", name: "Semantic Search", desc: "Vector search over your codebase", tag: "AI" },
];

const FEATURE_OVERLAP_ROWS = [
  {
    platform: "Seele AI",
    websiteBuilder: "✅",
    gameEngine: "✅ (Native 3D)",
    aiPlayground: "✅ (Asset & Agent Gen)",
    browserIde: "✅",
  },
  {
    platform: "Rosebud AI",
    websiteBuilder: "⚠️ (Interactive)",
    gameEngine: "✅",
    aiPlayground: "⚠️ (Asset Gen)",
    browserIde: "✅",
  },
  {
    platform: "GDevelop",
    websiteBuilder: "⚠️ (Game focus)",
    gameEngine: "✅ (Open Source)",
    aiPlayground: "✅ (AI Agent)",
    browserIde: "✅",
  },
  {
    platform: "CreatiCode",
    websiteBuilder: "❌",
    gameEngine: "✅",
    aiPlayground: "✅ (Training focus)",
    browserIde: "✅",
  },
  {
    platform: "Replit",
    websiteBuilder: "✅",
    gameEngine: "⚠️ (Requires libraries)",
    aiPlayground: "✅ (AI Agent)",
    browserIde: "✅",
  },
];


const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Community", href: "/community" },
];

export default function Homepage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const router = useRouter();
  const destinationNames = signMap.map((link) => link.label).join(", ");
  const iframeLabel = `PlayCanvas Landing Page destinations: ${destinationNames}`;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <main className="relative min-h-screen" style={{ backgroundColor: '#000000', color: '#ffffff' }}>

      {/* ─── TRANSPARENT STICKY NAVBAR ─────────────────────────────────────── */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-black/70 backdrop-blur-xl shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight text-white">AI Wonderland</span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <div className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-medium text-white/60 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-2">
            {/* Spirit Guide Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-purple-300/60">
              <span className="text-sm">🔮</span>
              <span>AI Guide</span>
            </div>
            
            {authLoading ? (
              <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/dashboard/projects"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Dashboard →
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/public-pages/auth"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Sign In
                </Link>
                <Link
                  href="/public-pages/auth"
                  className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO — Full-bleed image with overlaid content ─────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "100svh" }}>
        {/* Full-bleed background image */}
        <Image
          src="/images/wonderland-theme.webp"
          alt="AI Wonderland hero scene"
          fill
          priority
          className="object-cover object-left"
          sizes="100vw"
        />

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

        {/* Interactive sign overlays — keep original signpost behaviour */}
        <div className="absolute inset-0 z-10">
          {HOMEPAGE_SIGN_LINKS && (
            <InteractiveSignpost iframeLabel={iframeLabel} heroMode />
          )}
        </div>

        {/* Hero content overlay */}
        <div className="relative z-20 flex min-h-[100svh] flex-col justify-between px-6 pb-10 pt-24 sm:px-10">
          {/* Top: title + subtitle + CTA */}
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-400">
              AI Wonderland
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              Where your imagination<br className="hidden sm:block" /> comes to life
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/70 drop-shadow sm:text-base">
              Build websites and 3D games with AI — no coding required.
            </p>
            <div className="mt-6">
              <AIChat compact={true} />
            </div>
            
            {/* Spirit Guide Availability */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-purple-300/80">
              <span className="text-lg">🔮</span>
              <span>Spirit Guide AI assistant available</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── IMMEDIATE ACTION CTA ────────────────────────────────────────────── */}
      <section className="relative mx-auto -mt-16 w-full max-w-4xl px-6">
        <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-lg shadow-2xl shadow-purple-900/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 Ready to Create?</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Start building your 3D world in seconds. No experience needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/template_futuristic_city"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-900/30 group relative"
              >
                🏙️ Start with Futuristic City
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-purple-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  Pre-built futuristic city scene with neon lights and skyscrapers
                </div>
              </Link>
              
              <Link
                href="/wonder-build/playcanvas"
                className="px-6 py-3 border border-white/20 bg-white/5 rounded-lg text-white font-semibold hover:bg-white/10 transition group relative"
              >
                🎨 Start from Scratch
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-white/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  Blank canvas - build anything you imagine from the ground up
                </div>
              </Link>
              
              <Link
                href="/wonder-build/ai-builder"
                className="px-6 py-3 border border-green-500/30 bg-green-500/10 rounded-lg text-white font-semibold hover:bg-green-500/20 transition group relative"
              >
                🤖 AI Builder
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 border border-green-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48">
                  Describe what you want - AI builds it automatically
                </div>
              </Link>
              
              {/* Spirit Guide Button */}
              <button className="px-6 py-3 border border-purple-500/30 bg-purple-500/10 rounded-lg text-white font-semibold hover:bg-purple-500/20 transition group relative"
                onClick={openSpiritGuide}
              >
                🔮 Spirit Guide
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 border border-purple-500/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-56">
                  <strong>AI Assistant</strong><br/>
                  Ask me anything! I can help you create scenes, fix issues, or explain features.
                </div>
              </button>
            </div>
            <p className="text-white/40 text-sm mt-4">
              💡 Hover over buttons to see what they do
            </p>
          </div>
        </div>
      </section>

      {/* ─── WEBGL STUDIO CTA ───────────────────────────────────────────────── */}
      <section className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-black px-6 py-10 sm:px-8">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/4 translate-x-1/4 rounded-full bg-blue-600/20 blur-[80px]" />
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-400">PlayCanvas + WebGPU Studio</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">WebGL Studio Editor</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-400">
              Build and render real-time 3D worlds with PlayCanvas. Launch the full editor to start creating immersive scenes.
            </p>
          </div>
          <Link
            href="/wonder-build/playcanvas"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Launch Editor
          </Link>
        </div>
      </section>

      {/* ─── AI BUILDER CTA ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto mt-6 w-full max-w-6xl overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-black px-6 py-10 sm:px-8">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/4 translate-x-1/4 rounded-full bg-violet-600/20 blur-[80px]" />
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">AI Wonder Build</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">AI Builder — Websites &amp; Games</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-400">
              Describe what you want. Three AI agents collaborate — Architect, Builder, and Reviewer — to generate complete, working websites and playable games in under a minute.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Portfolio websites", "HTML5 games", "Dashboard UIs", "Landing pages", "Space shooters"].map((tag) => (
                <span key={tag} className="rounded-full bg-violet-900/40 border border-violet-500/20 px-3 py-0.5 text-xs text-violet-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/wonder-build/ai-builder"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500"
          >
            ✨ Open AI Builder
          </Link>
        </div>
      </section>

      {/* ─── BUILDER SHOWCASE SCREENSHOTS ───────────────────────────────────── */}
      <section id="builder-showcase" className="mx-auto mt-8 w-full max-w-7xl px-6 sm:px-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl shadow-cyan-900/20 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white">Builder Showcase</h2>
          <p className="mt-2 text-sm text-white/70">These are snapshots of the engines in action. Each card opens the builder experience so you can continue the flow immediately.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {BUILDER_SHOWCASE_CARDS.map((card) => (
              <Link
                key={card.title}
                href={toSafeInternalHref(card.href)}
                className="group overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/80 p-3 transition duration-300 hover:border-cyan-400/80 hover:bg-slate-900"
              >
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

      {/* ─── CODER WORKSPACES (Premium Feature) ───────────────────────────────── */}
      {isAuthenticated && (
        <section className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-black px-6 py-10 sm:px-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/4 translate-x-1/4 rounded-full bg-emerald-600/20 blur-[80px]" />
          <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">Premium Feature</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Cloud Development Workspace</h2>
              <p className="mt-1 max-w-xl text-sm text-gray-400">
                Get your own cloud development environment with VS Code, pre-configured for AI Wonderland projects.
                Available for Pro and Elite subscribers.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["VS Code in Browser", "Pre-configured AI Wonderland", "Git Integration", "Terminal Access"].map((tag) => (
                  <span key={tag} className="rounded-full bg-emerald-900/40 border border-emerald-500/20 px-3 py-0.5 text-xs text-emerald-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/coder-workspace"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
            >
              💻 Open Workspace
            </Link>
          </div>
        </section>
      )}

      {/* ─── REGISTRY / MARKETPLACE ─────────────────────────────────────────── */}
      <section id="features" className="relative mx-auto mt-10 w-full max-w-6xl px-6 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Extension Registry</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Plug-in anything. Extend everything.</h2>
            <p className="mt-1 text-sm text-gray-400">Curated extensions that plug into Playground and Wonder-Build.</p>
          </div>
          <Link
            href="/marketplace"
            className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
          >
            Browse All →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REGISTRY_ITEMS.map((item) => (
            <Link
              key={item.name}
              href="/marketplace"
              className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-500/30 hover:bg-white/[0.06]"
            >
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">{item.name}</p>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/40">
                    {item.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative mx-auto mt-16 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-950 to-black px-6 py-14 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="relative z-10">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400">Pricing</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Start free. Scale when ready.</h2>
            <p className="mt-3 text-sm text-gray-400 max-w-xl mx-auto">
              Everything you need to build, launch, and grow — pick the plan that fits your stage.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition ${
                  plan.highlight
                    ? "border-purple-500/60 bg-gradient-to-b from-purple-900/30 to-purple-950/20 shadow-xl shadow-purple-900/20 scale-105"
                    : plan.id === "team"
                    ? "border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-black"
                    : plan.id === "enterprise"
                    ? "border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                    MOST POPULAR
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {plan.icon && <span className="text-lg">{plan.icon}</span>}
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    plan.highlight ? "text-purple-400" : plan.id === "team" ? "text-blue-400" : plan.id === "enterprise" ? "text-cyan-400" : "text-white/30"
                  }`}>
                    {plan.tier}
                  </p>
                </div>
                <p className="text-lg font-bold text-white mb-2">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-white/40 mb-1">{plan.period}</span>}
                </div>
                <p className="text-xs text-gray-500 mb-5">{plan.desc}</p>
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className={`mt-0.5 shrink-0 ${
                        plan.id === "team" ? "text-blue-400" : plan.id === "enterprise" ? "text-cyan-400" : "text-green-400"
                      }`}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
                      : plan.id === "team"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
                      : plan.id === "enterprise"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90"
                      : "border border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ──────────────────────────────────────────────── */}
      <section className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-10 sm:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Compare Plans</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Choose the plan that fits your stage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Feature</th>
                <th className="py-3 px-4 text-center text-white/60 font-semibold">Nomad</th>
                <th className="py-3 px-4 text-center text-purple-400 font-semibold">Architect</th>
                <th className="py-3 px-4 text-center text-blue-400 font-semibold">Guild</th>
                <th className="py-3 px-4 text-center text-cyan-400 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 px-4 text-gray-300">Active Projects</td>
                <td className="py-3 px-4 text-center text-gray-400">1</td>
                <td className="py-3 px-4 text-center text-white">5</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">AI Chats</td>
                <td className="py-3 px-4 text-center text-gray-400">5/day</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">Puck UI Builder</td>
                <td className="py-3 px-4 text-center text-gray-400">Basic</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">3D Engine (PlayCanvas)</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">WonderSpace IDE</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">Custom Domain</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-white">1</td>
                <td className="py-3 px-4 text-center text-white">Multiple</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">Team Seats</td>
                <td className="py-3 px-4 text-center text-gray-400">1</td>
                <td className="py-3 px-4 text-center text-gray-400">1</td>
                <td className="py-3 px-4 text-center text-white">5</td>
                <td className="py-3 px-4 text-center text-white">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">Priority GPU</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">White-Labeling</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">SSO / SCIM</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-green-400">✓</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-300">Compute Credits</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-gray-500">—</td>
                <td className="py-3 px-4 text-center text-white">300K/mo</td>
                <td className="py-3 px-4 text-center text-white">Custom</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="py-3 px-4 text-gray-300">Support</td>
                <td className="py-3 px-4 text-center text-gray-400">Community</td>
                <td className="py-3 px-4 text-center text-white">Priority</td>
                <td className="py-3 px-4 text-center text-white">Dedicated</td>
                <td className="py-3 px-4 text-center text-white">SLA + Manager</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── PLATFORM FEATURE OVERLAP ─────────────────────────────────────── */}
      <section className="relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-10 sm:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">Comparison Table</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Feature Overlap</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Platform</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Website Builder</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">3D Game Engine</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">AI Playground/Training</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Browser-Based IDE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {FEATURE_OVERLAP_ROWS.map((row) => (
                <tr key={row.platform}>
                  <td className="py-3 px-4 text-white font-medium">{row.platform}</td>
                  <td className="py-3 px-4 text-gray-300">{row.websiteBuilder}</td>
                  <td className="py-3 px-4 text-gray-300">{row.gameEngine}</td>
                  <td className="py-3 px-4 text-gray-300">{row.aiPlayground}</td>
                  <td className="py-3 px-4 text-gray-300">{row.browserIde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── PLAYCANVAS INTEGRATION ─────────────────────────────────────────── */}
      <section className="relative mx-auto mt-12 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-10 sm:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Powerful <span className="text-blue-500">PlayCanvas</span> Integration
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

      {/* ─── FOOTER CTA ─────────────────────────────────────────────────────── */}
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
