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

const PLANS = [
  {
    id: "free",
    name: "The Nomad",
    tier: "Free",
    price: "$0",
    period: "",
    desc: "Get started with the basics. No credit card needed.",
    bullets: ["5 AI Chats/day", "Basic 2D Builder", "Community support"],
    cta: "Start Free",
    href: "/public-pages/auth",
    highlight: false,
  },
  {
    id: "pro",
    name: "The Architect",
    tier: "Pro",
    price: "$19",
    period: "/mo",
    desc: "For builders who want full creative power.",
    bullets: ["Unlimited AI Chats", "3D Engine access", "Egyptian Voice Module", "1-Click Deployment"],
    cta: "Become an Architect",
    href: "/subscription",
    highlight: true,
  },
  {
    id: "elite",
    name: "The Creator",
    tier: "Elite",
    price: "$49",
    period: "/mo",
    desc: "Everything in Pro — plus the power to go further.",
    bullets: ["Everything in Pro", "Priority GPU rendering", "Custom Domains", "God Mode"],
    cta: "Unlock God Mode",
    href: "/subscription",
    highlight: false,
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
    <main className="relative min-h-screen bg-black text-white">

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
          {/* Top: title + subtitle */}
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-pink-400">
              AI Wonderland
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              Where your imagination<br className="hidden sm:block" /> comes to life
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/70 drop-shadow sm:text-base">
              Follow the signpost to discover platform docs, tutorials, and the builder experiences.
            </p>
          </div>

          {/* Bottom: builder action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/wonder-build/playcanvas"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 backdrop-blur-sm transition hover:bg-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Open WebGL Studio
            </Link>
            <Link
              href="/wonder-build/ai-builder"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600/90 border border-violet-500/50 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 backdrop-blur-sm transition hover:bg-violet-500"
            >
              ✨ AI Builder
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
            >
              🗂 Registry
            </Link>
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
                    ? "border-purple-500/60 bg-gradient-to-b from-purple-900/30 to-purple-950/20 shadow-xl shadow-purple-900/20"
                    : plan.id === "elite"
                    ? "border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-black"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-md">
                    MOST POPULAR
                  </span>
                )}
                {plan.id === "elite" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-md">
                    GOD MODE
                  </span>
                )}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                  plan.highlight ? "text-purple-400" : plan.id === "elite" ? "text-amber-400" : "text-white/30"
                }`}>
                  {plan.tier}
                </p>
                <p className="text-lg font-bold text-white mb-2">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-sm text-white/40 mb-1">{plan.period}</span>}
                </div>
                <p className="text-xs text-gray-500 mb-5">{plan.desc}</p>
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className={`mt-0.5 shrink-0 ${plan.id === "elite" ? "text-amber-400" : "text-green-400"}`}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
                      : plan.id === "elite"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
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

      {/* ─── PLAYCANVAS INTEGRATION ─────────────────────────────────────────── */}
      <section className="relative mx-auto mt-12 w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black px-6 py-16 sm:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Powerful <span className="text-blue-500">PlayCanvas</span> Integration
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-base text-gray-400 sm:text-lg">
            Experience seamless real-time 3D editing and high-performance gameplay directly in the browser.
          </p>
          <div className="space-y-10">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-25 blur transition duration-1000 group-hover:opacity-50" />
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
                <Image
                  src="/images/playcanvas.png"
                  alt="PlayCanvas Editor Interface"
                  width={1920}
                  height={1080}
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="mx-auto max-w-4xl">
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
