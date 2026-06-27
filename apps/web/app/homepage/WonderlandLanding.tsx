'use client';

import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const PRODUCTS = [
  { icon: "⌘", title: "WonderBuild", desc: "Describe an app or workflow in plain language and get a working build — frontend, backend, and database wired together automatically.", href: "/wonder-build" },
  { icon: "▣", title: "Playground ↗", desc: "Chat with multiple models, test prompts, and run agent workflows side by side before they go to production.", external: true, href: "https://playground.dreammakerhub.website" },
  { icon: "◈", title: "WonderPlay 3D", desc: "A PlayCanvas-powered scene editor for building interactive 3D worlds and games without a heavyweight engine.", href: "/wonder-build/playcanvas" },
  { icon: "{ }", title: "WonderSpace IDE", desc: "A full browser IDE with an isolated workspace per user — clone, code, and run, no local environment needed.", href: "/wonderspace" },
  { icon: "⇄", title: "Marketplace", desc: "Publish what you build, or start from a template someone else made. Every listing is a real, running app.", href: "/marketplace" },
];

export default function WonderlandLandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard/projects");
    } else {
      router.push("/public-pages/auth");
    }
  };

  return (
    <main className="min-h-screen bg-[#14101D] text-[#F5F1E8] font-inter">
      {/* NAV */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-black/70 backdrop-blur-xl shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">AI Wonderland</span>
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            <Link href="#products" className="text-sm text-white/60 transition hover:text-white">
              Products
            </Link>
            <Link href="#how-it-works" className="text-sm text-white/60 transition hover:text-white">
              How it works
            </Link>
            <Link href="#personas" className="text-sm text-white/60 transition hover:text-white">
              Alice & Rick
            </Link>
            <Link href="/docs" className="text-sm text-white/60 transition hover:text-white">
              Docs
            </Link>
            <Link href="/blog" className="text-sm text-white/60 transition hover:text-white">
              Blog
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <Link
                href="/dashboard/projects"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/public-pages/auth"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={handleGetStarted}
              className="rounded-full bg-[#F2A93B] px-4 py-1.5 text-xs font-semibold text-black transition hover:opacity-90"
            >
              Start building
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="relative z-10 max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#F2A93B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F2A93B]" />
            AI-NATIVE CREATION PLATFORM
          </div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Build anything.<br />
            <em className="font-normal text-[#F2A93B]">Just by describing it.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/60">
            Describe an app, a 3D world, or an agent in plain language. AI Wonderland writes it, runs it in an isolated workspace, and ships it — no setup required.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="rounded-full bg-[#F2A93B] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Start building free
            </button>
            <Link
              href="#how-it-works"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCTS GRID */}
      <section id="products" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-lg">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-[#F2A93B]">Products</div>
            <h2 className="text-3xl font-bold">One platform, five doors in.</h2>
            <p className="mt-2 text-white/60">
              Every tool shares the same memory, the same auth, the same deploy pipeline — pick the door that fits what you're making.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) =>
              p.external ? (
                <a
                  key={p.title}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-white/10 bg-[#1C1629] p-6 transition hover:border-white/20"
                >
                  <div className="mb-4 text-2xl">{p.icon}</div>
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{p.desc}</p>
                </a>
              ) : (
                <Link
                  key={p.title}
                  href={p.href}
                  className="group rounded-xl border border-white/10 bg-[#1C1629] p-6 transition hover:border-white/20"
                >
                  <div className="mb-4 text-2xl">{p.icon}</div>
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{p.desc}</p>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 pt-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-lg">
            <div className="mb-3 text-xs font-medium uppercase tracking-widest text-[#F2A93B]">How it works</div>
            <h2 className="text-3xl font-bold">From sentence to shipped, in three steps.</h2>
          </div>
          <div className="grid gap-0 border-t border-white/10 sm:grid-cols-3">
            {[
              { n: "01", t: "Describe it", d: "Tell Wonderland what you want to build — a SaaS dashboard, a 3D scene, an autonomous agent. No spec document required." },
              { n: "02", t: "Watch it get built", d: "Your own isolated workspace spins up, the AI writes and tests the code live, and you can step in and edit anything at any point." },
              { n: "03", t: "Ship it", d: "Deploy straight from the workspace. Your build keeps its memory, its data, and its auth — ready for real users." },
            ].map((s, i) => (
              <div key={s.n} className={`border-white/10 p-8 ${i < 2 ? "border-r" : ""}`}>
                <div className="text-xs font-mono text-[#F2A93B]">{s.n}</div>
                <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-white/60">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 text-xs font-medium uppercase tracking-widest text-[#F2A93B]">
            Ready when you are
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">Fall down the rabbit hole.</h2>
          <p className="mt-4 text-white/60">Free to start. No setup, no local environment, no blank-page problem.</p>
          <button
            onClick={handleGetStarted}
            className="mt-8 rounded-full bg-[#F2A93B] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Start building free
          </button>
        </div>
      </section>
    </main>
  );
}