'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import AIDiagram from "./AIDiagram";
import HomepageNavbar from "./HomepageNavbar";
import PricingSection from "./PricingSection";
import HeroBanner from "@/components/homepage/HeroBanner";
import { PLANS } from "./data";

type Product = {
  name: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  image?: string;
  external?: boolean;
  accent: string;
};

const PRODUCTS: Product[] = [
  {
    name: "WonderBuild",
    label: "Websites & Apps",
    description: "Create from a prompt, then edit visually or with code and publish from one builder.",
    href: "/wonder-build",
    icon: "⚡",
    image: "/images/screenshots/puck-builder.svg",
    accent: "from-violet-500/25 to-fuchsia-500/10",
  },
  {
    name: "WonderSpace",
    label: "Cloud Development",
    description: "A browser workspace for coding, terminals, Git workflows, and AI-assisted development.",
    href: "/wonderspace",
    icon: "💻",
    image: "/images/screenshots/theia-builder.svg",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    name: "AI Playground",
    label: "Models & BYOK",
    description: "Experiment with multiple AI providers and models without locking your workflow to one vendor.",
    href: "https://playground.dreammakerhub.website/",
    icon: "🤖",
    external: true,
    accent: "from-cyan-500/20 to-blue-500/10",
  },
  {
    name: "WonderPlay",
    label: "3D Studio",
    description: "Build and edit realtime 3D scenes, worlds, assets, materials, lighting, and interactions.",
    href: "/dashboard/3dhub",
    icon: "🎮",
    image: "/images/screenshots/playcanvas-builder.svg",
    accent: "from-blue-500/20 to-cyan-500/10",
  },
  {
    name: "NPC-AI-SIM",
    label: "AI Characters",
    description: "Create, configure, test, and export intelligent 3D NPCs with behavior, voice, memory, and AI.",
    href: "/wonder-play",
    icon: "🧙",
    accent: "from-pink-500/20 to-purple-500/10",
  },
];

const STEPS = [
  ["01", "Describe", "Tell AI what you want to create in plain language."],
  ["02", "Generate", "Start from AI output, a template, or a blank project."],
  ["03", "Edit", "Use visual tools, code, AI commands, or all three together."],
  ["04", "Ship", "Preview, test, export, or publish when it is ready."],
] as const;

const DEMOS = [
  {
    title: "WonderBuild visual editor",
    description: "Drag-and-drop website and app editing with a live canvas.",
    image: "/images/screenshots/puck-builder.svg",
    href: "/wonder-build/builder",
  },
  {
    title: "WonderSpace cloud IDE",
    description: "A full coding workspace that runs in the browser.",
    image: "/images/screenshots/theia-builder.svg",
    href: "/ide",
  },
  {
    title: "WonderPlay realtime 3D",
    description: "Scene editing and 3D creation without leaving the platform.",
    image: "/images/screenshots/playcanvas-builder.svg",
    href: "/dashboard/3dhub",
  },
] as const;

function ProductCard({ product }: { product: Product }) {
  const content = (
    <div className={`group h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${product.accent} p-px transition hover:border-white/25 hover:-translate-y-0.5`}>
      <div className="flex h-full flex-col rounded-[15px] bg-[#070a11]/95 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xl">
            {product.icon}
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            {product.label}
          </span>
        </div>

        {product.image ? (
          <div className="relative mt-5 h-40 overflow-hidden rounded-xl border border-white/10 bg-[#05070c] sm:h-44">
            <Image
              src={product.image}
              alt={`${product.name} interface preview`}
              fill
              className="object-cover object-top opacity-90 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        ) : (
          <div className="mt-5 flex h-40 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_25%,rgba(56,189,248,0.13),transparent_42%),linear-gradient(145deg,#070b14,#05060a)] sm:h-44">
            <div className="w-[78%] rounded-xl border border-white/10 bg-black/55 p-3 shadow-2xl">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink-400/70" />
                <span className="h-2 w-2 rounded-full bg-amber-300/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-2/3 rounded bg-white/15" />
                <div className="h-2 w-full rounded bg-cyan-400/10" />
                <div className="h-2 w-4/5 rounded bg-purple-400/10" />
              </div>
            </div>
          </div>
        )}

        <h3 className="mt-5 text-xl font-bold text-white">{product.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-white/58">{product.description}</p>
        <span className="mt-5 inline-flex items-center text-sm font-semibold text-cyan-300">
          Open {product.name} →
        </span>
      </div>
    </div>
  );

  if (product.external) {
    return <a href={product.href}>{content}</a>;
  }

  return <Link href={product.href}>{content}</Link>;
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
            One platform for AI creation
          </span>

          <h1 className="mt-7 max-w-5xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Build websites, apps, AI experiences and
            <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              3D worlds with AI.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
            Start with a prompt. Keep control with visual editors and real code. Use the same projects across WonderBuild, WonderSpace, AI Playground, WonderPlay, and NPC-AI-SIM.
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Link
              href={primaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-7 py-3 text-sm font-bold text-white shadow-[0_16px_50px_rgba(124,58,237,0.25)] transition hover:brightness-110"
            >
              {user ? "Open My Projects" : "Start Building Free"}
            </Link>
            <a
              href="#products"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] px-7 py-3 text-sm font-semibold text-white/85 backdrop-blur transition hover:bg-white/[0.09]"
            >
              Explore the platform
            </a>
          </div>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-2 text-left sm:grid-cols-4">
            {["Prompt → project", "Visual + code", "Multi-provider AI", "Web + 3D"].map((item) => (
              <div key={item} className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-xs font-medium text-white/55 backdrop-blur">
                <span className="mr-2 text-emerald-400">✓</span>{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">How it works</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">One flow from idea to something real</h2>
          <p className="mt-3 text-sm leading-6 text-white/50 sm:text-base">You should not need to learn the platform before you can start creating.</p>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([number, title, copy]) => (
            <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="text-xs font-black tracking-[0.2em] text-cyan-300/70">{number}</div>
              <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-8 sm:px-8 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">The platform</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Five products. One ecosystem.</h2>
          <p className="mt-3 text-sm leading-6 text-white/50 sm:text-base">
            Choose the tool that fits the work. Your homepage should explain the products, not expose every internal route and implementation detail.
          </p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((product) => <ProductCard key={product.name} product={product} />)}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">See it in action</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Real tools, not decorative filler</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-white/45">The homepage now gives the product UI room to sell the platform instead of stacking repeated showcase sections.</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {DEMOS.map((demo) => (
            <Link key={demo.title} href={demo.href} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#070a10] transition hover:border-cyan-400/35">
              <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-black">
                <Image src={demo.image} alt={demo.title} fill className="object-cover object-top transition duration-300 group-hover:scale-[1.015]" sizes="(max-width: 1024px) 100vw, 420px" />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-white">{demo.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{demo.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <AIDiagram />
      <PricingSection plans={PLANS} />

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_35%),#07070b] px-6 py-12 text-center sm:px-10 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">AI Wonderland Innovation</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">Start with an idea. Build the rest here.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Use AI to move faster without giving up visual control, code access, provider choice, or ownership of the project.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-bold text-black transition hover:bg-white/90">
              {user ? "Go to Dashboard" : "Create an Account"}
            </Link>
            <Link href="/docs" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#05060a]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div>
            <div className="text-lg font-black text-white">AI Wonderland</div>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/40">AI creation tools for websites, apps, code, realtime 3D, and intelligent characters.</p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/35">Build</div>
            <div className="mt-3 space-y-2 text-sm text-white/55"><Link className="block hover:text-white" href="/wonder-build">WonderBuild</Link><Link className="block hover:text-white" href="/wonderspace">WonderSpace</Link><Link className="block hover:text-white" href="/wonder-play">NPC-AI-SIM</Link></div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/35">Explore</div>
            <div className="mt-3 space-y-2 text-sm text-white/55"><Link className="block hover:text-white" href="/dashboard/projects">Projects</Link><Link className="block hover:text-white" href="/marketplace">Marketplace</Link><Link className="block hover:text-white" href="/community">Community</Link></div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/35">Company</div>
            <div className="mt-3 space-y-2 text-sm text-white/55"><Link className="block hover:text-white" href="/about">About</Link><Link className="block hover:text-white" href="/contact">Contact</Link><Link className="block hover:text-white" href="/privacy">Privacy</Link></div>
          </div>
        </div>
      </footer>
    </main>
  );
}
