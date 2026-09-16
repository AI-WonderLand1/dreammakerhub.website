'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Code2,
  Cuboid,
  FileCode2,
  Globe2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
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
  tone: string;
  includes: string[];
};

const PRODUCT_PATHS: ProductPath[] = [
  {
    name: "WonderBuild",
    label: "AI + Visual Creation",
    description: "Create websites and apps with AI, drag-and-drop editing, real project files, preview, and publishing in one flow.",
    href: "/wonder-build",
    image: "/images/screenshots/puck-builder.svg",
    tone: "from-violet-950 via-indigo-950 to-slate-950 border-violet-400/30",
    includes: ["AI generation", "Drag and drop", "Real files", "Live preview", "Publish"],
  },
  {
    name: "WonderSpace",
    label: "Cloud Development Workspace",
    description: "Move into a real development workspace when you need files, code, terminals, Git, and AI coding assistance.",
    href: "/wonderspace",
    image: "/images/screenshots/theia-builder.svg",
    tone: "from-cyan-950 via-slate-950 to-slate-950 border-cyan-400/30",
    includes: ["File manager", "Code editor", "Terminal", "Git", "AI coding"],
  },
  {
    name: "WonderPlay",
    label: "3D & Interactive Creation",
    description: "Build realtime 3D projects, scenes, assets, and intelligent characters without mixing 3D controls into the web builder.",
    href: "/dashboard/3dhub",
    image: "/images/screenshots/playcanvas-builder.svg",
    tone: "from-orange-950 via-amber-950 to-slate-950 border-orange-400/30",
    includes: ["3D projects", "Scenes & assets", "AI NPCs", "Interactive worlds", "Exports"],
  },
];

const STEPS = [
  ["1", "Sign in", "Create your account and open your projects."],
  ["2", "Create or choose", "Start from a template, prompt, existing project, or blank canvas."],
  ["3", "Build & publish", "Use AI, visual editing, real files, preview, test, and publish."],
] as const;

const SHOWCASE = [
  { title: "Visual Builder", type: "WonderBuild", image: "/images/screenshots/puck-builder.svg", href: "/wonder-build" },
  { title: "Cloud IDE", type: "WonderSpace", image: "/images/screenshots/theia-builder.svg", href: "/wonderspace" },
  { title: "3D Studio", type: "WonderPlay", image: "/images/screenshots/playcanvas-builder.svg", href: "/dashboard/3dhub" },
  { title: "Community", type: "Questions, help & showcases", image: "/images/community-preview.svg", href: "/community" },
];

function ProductPathCard({ product }: { product: ProductPath }) {
  return (
    <Link
      href={product.href}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br ${product.tone} p-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black tracking-tight">{product.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{product.label}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-white/70 transition group-hover:translate-x-1" />
      </div>
      <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <Image src={product.image} alt={`${product.name} interface`} fill className="object-cover object-top" sizes="(max-width: 1024px) 100vw, 420px" />
      </div>
      <p className="mt-4 text-sm leading-6 text-white/70">{product.description}</p>
      <ul className="mt-5 grid gap-2 text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {product.includes.map((item) => (
          <li key={item} className="flex items-center gap-2"><span className="text-cyan-300">✓</span>{item}</li>
        ))}
      </ul>
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
    <main className="relative min-h-screen overflow-hidden bg-transparent text-slate-950">
      <HeroBanner />
      <HomepageNavbar scrolled={scrolled} />

      <section className="relative z-10 isolate min-h-[760px] overflow-hidden border-b border-white/10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(99,102,241,.22),transparent_24%),radial-gradient(circle_at_24%_18%,rgba(14,165,233,.16),transparent_30%),linear-gradient(to_bottom,rgba(2,6,23,.12),rgba(2,6,23,.42))]" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-transparent via-[#17305d]/30 to-[#8fb9e6]/45" />
        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-5 pb-28 pt-28 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">Turn ideas into reality</p>
            <h1 className="mt-5 text-5xl font-black leading-[.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Build without
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">limits.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Websites, apps, cloud development, AI workflows, and 3D experiences from one platform built around real project files.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-[0_14px_45px_rgba(99,102,241,.35)] transition hover:brightness-110">
                {user ? "Open My Projects" : "Start Building Free"}<ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#workflow" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-black/25 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10">See how it works</a>
            </div>
            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                [WandSparkles, "Build", "Web & apps"],
                [Code2, "Code", "In the cloud"],
                [Cuboid, "Create", "3D & interactive"],
                [Sparkles, "Explore", "AI possibilities"],
              ].map(([Icon, title, copy]) => (
                <div key={String(title)} className="rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-md">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <p className="mt-2 font-bold">{String(title)}</p>
                  <p className="text-xs text-white/55">{String(copy)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 bg-gradient-to-b from-[#83afe0]/45 via-[#edf7ff]/70 to-[#fffdf7]/82 backdrop-blur-[1px]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,196,126,.08),rgba(255,255,255,.18)_38%,rgba(255,244,214,.24)_100%)]" />

        <section id="workflow" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">Get started in three simple steps</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">From idea to live in minutes.</h2>
            <p className="mt-3 text-sm text-slate-700 sm:text-base">No route maze. Create, customize, preview, and publish.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(([number, title, copy], index) => (
              <div key={number} className="relative rounded-2xl border border-white/75 bg-white/66 p-6 shadow-lg shadow-blue-950/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <span className={`grid h-11 w-11 place-items-center rounded-full text-lg font-black text-white shadow-lg ${index === 0 ? "bg-violet-600" : index === 1 ? "bg-blue-600" : "bg-cyan-600"}`}>{number}</span>
                  <h3 className="text-lg font-black">{title}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {PRODUCT_PATHS.map((product) => <ProductPathCard key={product.name} product={product} />)}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="grid items-center gap-8 rounded-3xl border border-white/75 bg-white/72 p-6 shadow-xl shadow-blue-950/5 backdrop-blur-md md:grid-cols-[.8fr,1.2fr] sm:p-8">
            <div>
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100 text-violet-700"><Bot className="h-8 w-8" /></div>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">AI that works with your project.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base">Use multiple AI providers, persistent project context, memory, and transparent AI behavior while keeping access to your real files and development tools.</p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2"><BrainCircuit className="h-4 w-4 text-violet-600" />Project memory</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2"><Sparkles className="h-4 w-4 text-blue-600" />AI Playground</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2"><ShieldCheck className="h-4 w-4 text-cyan-700" />AI transparency</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-[#07101f]/96 p-5 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-sm font-bold">DreamMaker Assistant</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[.04] p-4 text-sm text-white/70">How can I help you build today?</div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {["Create a website", "Generate 3D assets", "Write code", "Improve my project"].map((item) => <div key={item} className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-white/70">{item}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">See what is possible</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Real tools. Real project files.</h2>
            </div>
            <Link href="/templates" className="hidden text-sm font-bold text-indigo-800 sm:inline-flex">Explore templates →</Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE.map((item) => (
              <Link key={item.title} href={item.href} className="group overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[16/10] bg-slate-100/70"><Image src={item.image} alt={item.title} fill className="object-cover object-top transition duration-300 group-hover:scale-[1.02]" sizes="(max-width:1024px) 50vw, 25vw" /></div>
                <div className="p-4"><h3 className="font-black">{item.title}</h3><p className="mt-1 text-xs text-slate-600">{item.type}</p></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div className="rounded-2xl border border-white/80 bg-white/76 p-6 shadow-sm backdrop-blur-md sm:p-7">
            <Users className="h-8 w-8 text-violet-600" />
            <h2 className="mt-4 text-2xl font-black">Build with a community.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Ask questions, request help, share projects, vote, reply, and learn from other members. Reading is public; posting requires membership.</p>
            <Link href="/community" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white">Visit Community <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/76 p-6 shadow-sm backdrop-blur-md sm:p-7">
            <FileCode2 className="h-8 w-8 text-blue-600" />
            <h2 className="mt-4 text-2xl font-black">Follow the build.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Product updates, technical lessons, founder notes, and the messy parts of building DreamMakerHub in public.</p>
            <Link href="/blog" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Read the Blog <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </div>

      <PricingSection plans={PLANS} />

      <section className="relative z-10 overflow-hidden bg-gradient-to-b from-white/78 via-amber-50/76 to-emerald-50/78 px-5 py-20 text-center backdrop-blur-[1px] sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,.10),transparent_25%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-3xl">
          <Globe2 className="mx-auto h-10 w-10 text-indigo-700" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Ideas build brighter worlds</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Turn an idea into something real.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-700 sm:text-base">Start with a prompt, template, or blank project. Use the simple tools first and go deeper when you need them.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg">{user ? "Open Projects" : "Start Building Free"}<Rocket className="h-4 w-4" /></Link>
            <Link href="/wonder-build" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white/85 px-6 py-3 text-sm font-bold text-slate-800 backdrop-blur">Explore Templates</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
