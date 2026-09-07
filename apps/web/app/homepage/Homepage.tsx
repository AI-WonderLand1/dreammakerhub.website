'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import HomepageNavbar from "./HomepageNavbar";
import PricingSection from "./PricingSection";
import HeroBanner from "@/components/homepage/HeroBanner";
import { PLANS } from "./data";

type ProductPath = {
  name: string;
  label: string;
  description: string;
  href: string;
  image: string;
  accent: string;
  includes: string[];
};

const PRODUCT_PATHS: ProductPath[] = [
  {
    name: "WonderBuild",
    label: "Build",
    description: "Create a website or web app, then edit it with AI, drag-and-drop controls, code, preview, and publish from one place.",
    href: "/wonder-build",
    image: "/images/screenshots/puck-builder.svg",
    accent: "from-violet-500/25 to-fuchsia-500/10",
    includes: ["AI generation", "Templates", "Visual editor", "Preview + publish"],
  },
  {
    name: "WonderSpace",
    label: "Code",
    description: "Open a browser development workspace when you need files, Git, terminals, coding agents, and deeper control.",
    href: "/wonderspace",
    image: "/images/screenshots/theia-builder.svg",
    accent: "from-amber-500/20 to-orange-500/10",
    includes: ["Cloud IDE", "Terminal + Git", "AI coding", "AI Playground"],
  },
  {
    name: "WonderPlay",
    label: "3D",
    description: "Create realtime scenes, games, worlds, and intelligent characters without mixing 3D controls into the website builder.",
    href: "/dashboard/3dhub",
    image: "/images/screenshots/playcanvas-builder.svg",
    accent: "from-cyan-500/20 to-blue-500/10",
    includes: ["3D studio", "PlayCanvas", "NPC-AI-SIM", "Scenes + assets"],
  },
];

const STEPS = [
  ["01", "Start", "Sign in, create a project, and choose Build, Code, or 3D."],
  ["02", "Create", "Start from AI, a template, an existing project, or a blank canvas."],
  ["03", "Finish", "Edit, preview, test, then publish or export when it is ready."],
] as const;

function ProductPathCard({ product }: { product: ProductPath }) {
  return (
    <Link
      href={product.href}
      className={`group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${product.accent} p-px transition hover:-translate-y-1 hover:border-white/25`}
    >
      <div className="flex h-full flex-col rounded-[23px] bg-[#070a11]/95 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/55">
            {product.label}
          </span>
          <span className="text-sm font-bold text-cyan-300">Open →</span>
        </div>

        <div className="relative mt-5 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black">
          <Image
            src={product.image}
            alt={`${product.name} interface preview`}
            fill
            className="object-cover object-top opacity-90 transition duration-300 group-hover:scale-[1.015] group-hover:opacity-100"
            sizes="(max-width: 1024px) 100vw, 420px"
          />
        </div>

        <h3 className="mt-5 text-2xl font-black tracking-tight text-white">{product.name}</h3>
        <p className="mt-2 text-sm leading-6 text-white/55">{product.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {product.includes.map((item) => (
            <span key={item} className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-white/45">
              {item}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function Homepage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const primaryHref = user ? "/dashboard/projects" : "/public-pages/auth?signup=true";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <HomepageNavbar scrolled={scrolled} />

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <HeroBanner />
        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl flex-col items-center justify-center px-5 pb-20 pt-28 text-center sm:min-h-[760px] sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/[0.07] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Build. Code. 3D.
          </span>

          <h1 className="mt-7 max-w-5xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Start with an idea.
            <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              Build it without getting lost.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
            AI Wonderland gives you three clear places to work: WonderBuild for websites and apps, WonderSpace for code, and WonderPlay for 3D.
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link
              href={primaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-7 py-3 text-sm font-bold text-white shadow-[0_16px_50px_rgba(124,58,237,0.25)] transition hover:brightness-110"
            >
              {user ? "Open My Projects" : "Start Building Free"}
            </Link>
            <a
              href="#choose"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-7 py-3 text-sm font-semibold text-white/85 backdrop-blur transition hover:bg-white/[0.09]"
            >
              Choose a workspace
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs font-medium text-white/45">
            <span className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">AI + visual editing</span>
            <span className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">Real code access</span>
            <span className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">Multi-provider AI</span>
            <span className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">Web + realtime 3D</span>
          </div>
        </div>
      </section>

      <section id="choose" className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Choose where you are working</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Three products. Three jobs.</h2>
          <p className="mt-4 text-sm leading-6 text-white/50 sm:text-base">
            Advanced editors and tools still exist, but they live inside the product they belong to instead of competing for space in the main navigation.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PRODUCT_PATHS.map((product) => (
            <ProductPathCard key={product.name} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Simple project flow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Start → Create → Finish</h2>
            <p className="mt-3 text-sm leading-6 text-white/50 sm:text-base">You should not need a route map to build a project.</p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {STEPS.map(([number, title, copy]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-xs font-black tracking-[0.2em] text-cyan-300/70">{number}</div>
                <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection plans={PLANS} />

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_35%),#07070b] px-6 py-12 text-center sm:px-10 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">AI Wonderland Innovation</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">One account. One project list. Three ways to build.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
            Start in Projects, then open the workspace that matches what you are making. The advanced tools stay available without turning the homepage into a control panel.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-white/90">
              {user ? "Open Projects" : "Create an Account"}
            </Link>
            <Link href="/docs" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#05060a]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-lg font-black text-white">AI Wonderland</Link>
            <p className="mt-1 text-sm text-white/40">Build websites, code, and 3D experiences with AI.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/55">
            <Link className="hover:text-white" href="/wonder-build">Build</Link>
            <Link className="hover:text-white" href="/wonderspace">Code</Link>
            <Link className="hover:text-white" href="/dashboard/3dhub">3D</Link>
            <Link className="hover:text-white" href="/dashboard/projects">Projects</Link>
            <Link className="hover:text-white" href="/docs">Docs</Link>
            <Link className="hover:text-white" href="/about">About</Link>
            <Link className="hover:text-white" href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
