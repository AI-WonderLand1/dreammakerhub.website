'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  Code2,
  Cuboid,
  FileCode2,
  Rocket,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import HomepageNavbar from './HomepageNavbar';
import { PLANS } from './data';
import styles from './ScenicHomepage.module.css';

const capabilities = [
  [WandSparkles, 'Build', 'Web & Apps'],
  [Code2, 'Code', 'with AI'],
  [Cuboid, 'Create', '3D & Interactive'],
  [Sparkles, 'Explore', 'AI Workflows'],
  [BrainCircuit, 'AI Tools', 'All in One'],
  [Users, 'Community', 'Create Together'],
] as const;

const products = [
  {
    name: 'WonderBuild',
    subtitle: 'AI Visual Creation',
    href: '/wonder-build',
    image: '/images/screenshots/puck-builder.svg',
    accent: 'violet',
    cta: 'Start Building',
    features: ['AI-generated sites & apps', 'Drag and drop editing', 'Real project files', 'Live preview', 'Publish anywhere'],
  },
  {
    name: 'WonderSpace',
    subtitle: 'Cloud Development Workspace',
    href: '/wonderspace',
    image: '/images/screenshots/theia-builder.svg',
    accent: 'cyan',
    cta: 'Open Workspace',
    features: ['Real-time coding', 'Code editor', 'Terminal', 'Git integration', 'AI pair programming'],
  },
  {
    name: 'WonderPlay',
    subtitle: '3D & Interactive Creation',
    href: '/dashboard/3dhub',
    image: '/images/screenshots/playcanvas-builder.svg',
    accent: 'amber',
    cta: 'Start Creating',
    features: ['3D projects & assets', 'AI NPCs & characters', 'Interactive experiences', 'Game-ready exports', 'Built-in AI tools'],
  },
] as const;

const showcases = [
  { title: 'Visual Builder', subtitle: 'WonderBuild', image: '/images/screenshots/puck-builder.svg', href: '/wonder-build' },
  { title: '3D Studio', subtitle: 'WonderPlay', image: '/images/3DWONDERPLAYIMAGE.webp', href: '/dashboard/3dhub' },
  { title: 'Project Dashboard', subtitle: 'Projects', image: '/images/dashboard-preview.svg', href: '/dashboard/projects' },
  { title: 'Interactive World', subtitle: '3D Experience', image: '/images/wonderland-theme.webp', href: '/wonder-play' },
  { title: 'Cloud IDE', subtitle: 'WonderSpace', image: '/images/screenshots/theia-builder.svg', href: '/wonderspace' },
  { title: 'Community', subtitle: 'Questions & Showcases', image: '/images/community-preview.svg', href: '/community' },
] as const;

const comparisonRows = [
  ['Active projects', '1', '—', '—', 'Unlimited'],
  ['AI chats', '5/day', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['WonderBuild', 'Included', 'Included', 'Included', 'Included'],
  ['Custom domain', 'Subdomain', 'Included', 'Included', 'Included'],
  ['Team seats', '—', '—', 'Up to 5', 'Custom'],
  ['Collaborative IDE', '—', '—', 'Included', 'Included'],
  ['SSO + SCIM', '—', '—', '—', 'Included'],
] as const;

function ProductCard({ product }: { product: (typeof products)[number] }) {
  const tone = product.accent === 'violet'
    ? 'border-violet-400/45 from-violet-950/95 via-indigo-950/95 to-slate-950/95 shadow-violet-950/25'
    : product.accent === 'cyan'
      ? 'border-cyan-400/45 from-cyan-950/95 via-slate-950/95 to-slate-950/95 shadow-cyan-950/25'
      : 'border-amber-400/45 from-amber-950/95 via-orange-950/95 to-slate-950/95 shadow-orange-950/25';
  const bullet = product.accent === 'violet' ? 'text-violet-300' : product.accent === 'cyan' ? 'text-cyan-300' : 'text-amber-300';

  return (
    <article className={`overflow-hidden rounded-[20px] border bg-gradient-to-br ${tone} p-4 text-white shadow-2xl backdrop-blur-xl`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight">{product.name}</h3>
          <p className={`mt-1 text-sm font-semibold ${bullet}`}>{product.subtitle}</p>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 text-white/70" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.05fr_.95fr] lg:grid-cols-1 xl:grid-cols-[1.05fr_.95fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-black/30">
          <Image src={product.image} alt={`${product.name} interface`} fill className="object-cover object-top" sizes="420px" />
        </div>
        <ul className="grid content-start gap-2 pt-1 text-[13px] text-white/82">
          {product.features.map((item) => (
            <li key={item} className="flex items-start gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${bullet}`} />{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Link href={product.href} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white/15">{product.cta}</Link>
        <Link href={product.href} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">Learn More</Link>
      </div>
    </article>
  );
}

export default function MockupHomepage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const primaryHref = user ? '/dashboard/projects' : '/public-pages/auth?signup=true';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className={styles.homepage}>
      <div className={styles.landscape} aria-hidden="true">
        <Image src="/images/homepage-landscape.webp" alt="" fill priority unoptimized sizes="100vw" className={styles.landscapeImage} />
      </div>

      <HomepageNavbar scrolled={scrolled} />

      <section className="relative z-10 mx-auto grid min-h-[490px] max-w-7xl items-center gap-8 px-5 pb-10 pt-24 text-white sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200/80">Turn ideas into reality</p>
          <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-[-.045em] sm:text-5xl lg:text-[58px]">
            Build Websites, Apps,
            <span className="block bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">AI Workflows & 3D Experiences with AI.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/72">All the tools, AI, and community you need to go from idea to real, faster, easier, and together.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={primaryHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 text-sm font-black text-white shadow-[0_12px_32px_rgba(79,70,229,.35)]">Start Building Free <ArrowRight className="h-4 w-4" /></Link>
            <a href="#workflow" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-black/25 px-5 text-sm font-bold text-white backdrop-blur-md">Watch / Explore</a>
          </div>
        </div>

        <div aria-hidden="true" className="hidden lg:block" />
      </section>

      <section className="relative z-10 border-y border-white/10 bg-[#071323]/52 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {capabilities.map(([Icon, title, copy]) => (
            <div key={title} className="flex items-center gap-3 border-white/10 px-4 py-4 lg:border-r last:border-r-0">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/15"><Icon className="h-4 w-4 text-cyan-300" /></span>
              <div><p className="text-xs font-black text-white">{title}</p><p className="mt-0.5 text-[10px] text-white/42">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.content}>
        <section id="workflow" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-blue-950">Get started in three simple steps</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">From Idea to Live in Minutes</h2>
            <p className="mt-1 text-sm text-slate-700">No complex setup. Just create, customize, and publish.</p>
          </div>

          <div className="relative mt-8 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[17%] right-[17%] top-6 hidden h-px bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 md:block" />
            {[
              ['1', 'Sign In', 'Create your free account and access all tools.'],
              ['2', 'Create or Choose', 'Start from a template, prompt, or blank project.'],
              ['3', 'Build & Publish', 'Use AI, drag and drop, code, preview, and share.'],
            ].map(([n, title, copy], i) => (
              <div key={n} className="relative text-center">
                <span className={`relative z-10 mx-auto grid h-12 w-12 place-items-center rounded-full border-4 border-white text-lg font-black text-white ${i === 0 ? 'bg-violet-600' : i === 1 ? 'bg-blue-600' : 'bg-cyan-600'}`}>{n}</span>
                <h3 className="mt-3 text-base font-black">{title}</h3>
                <p className="mx-auto mt-1 max-w-[240px] text-xs leading-5 text-slate-700">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {products.map((product) => <ProductCard key={product.name} product={product} />)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid items-center gap-5 rounded-[22px] border border-white/40 bg-blue-950/60 p-5 text-white shadow-xl backdrop-blur-md lg:grid-cols-[.9fr_1.1fr]">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border border-cyan-300/25 bg-cyan-400/10">
                <Image src="/images/3DWONDERPLAYIMAGE.webp" alt="DreamMakerHub AI" fill className="object-cover" sizes="112px" />
              </div>
              <div>
                <h2 className="text-2xl font-black leading-tight">AI that works<br />with your project.</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">Multi-provider AI, persistent project memory, code and builder assistance, and transparent AI behavior.</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-white/65">
                  <span>Smart assistance</span><span>Project memory</span><span>AI Playground</span><span>AI Truth</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[#06101d]/90 p-4 shadow-2xl">
              <div className="flex items-center justify-between"><span className="text-sm font-black">DreamMaker Assistant</span><span className="h-2 w-2 rounded-full bg-emerald-400" /></div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-white/60">How can I help you build today?</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Create a website', 'Generate 3D models', 'Write code', 'Improve my project'].map((x) => <span key={x} className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-[11px] text-white/70">{x}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-950">See what is possible</p><h2 className="mt-1 text-2xl font-black">Explore the tools. Create your world.</h2></div>
            <Link href="/templates" className="text-xs font-bold text-blue-950">Explore more projects →</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {showcases.map((item) => (
              <Link key={item.title} href={item.href} className="overflow-hidden rounded-xl border border-white/65 bg-blue-950/45 text-white shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[16/10] bg-slate-100/70"><Image src={item.image} alt={item.title} fill className="object-cover object-top" sizes="240px" /></div>
                <div className="p-3"><p className="text-xs font-black">{item.title}</p><p className="mt-0.5 text-[10px] text-blue-100">{item.subtitle}</p></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div className="rounded-2xl border border-white/70 bg-blue-950/45 text-white p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-start gap-3"><Users className="mt-1 h-6 w-6 text-violet-200" /><div><h2 className="text-xl font-black">Build with a Global Community</h2><p className="mt-1 text-sm text-blue-50">Ask questions, share projects, get help, and connect with creators.</p></div></div>
            <div className="mt-5 flex items-center justify-between gap-4"><div className="flex -space-x-2">{[0,1,2,3,4].map((n) => <span key={n} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-violet-200 to-cyan-200 text-[10px] font-black text-slate-700">{n+1}</span>)}</div><Link href="/community" className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-black text-white">Visit Community →</Link></div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-blue-950/45 text-white p-5 shadow-sm backdrop-blur-md">
            <div className="flex items-start gap-3"><FileCode2 className="mt-1 h-6 w-6 text-cyan-200" /><div><h2 className="text-xl font-black">From Our Blog</h2><p className="mt-1 text-sm text-blue-50">Product updates, tutorials, and stories from the build.</p></div></div>
            <div className="mt-4 grid gap-2 text-xs"><Link href="/blog/why-im-building-dreammakerhub" className="rounded-lg bg-slate-950/40 px-3 py-2 font-bold">Why I’m Building DreamMakerHub</Link><Link href="/blog" className="rounded-lg bg-slate-950/40 px-3 py-2 font-bold">Building an AI Platform While Learning to Code</Link></div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="text-center"><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-950">Simple pricing for bigger ideas</p><h2 className="mt-2 text-3xl font-black">Choose the plan that fits your journey.</h2><p className="mt-1 text-sm text-slate-700">Start free. Upgrade when you are ready.</p></div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <article key={plan.id} className={`relative flex flex-col rounded-2xl border p-5 shadow-lg backdrop-blur-md ${plan.highlight ? 'border-violet-400/60 bg-violet-950/78 text-white' : 'border-white/60 bg-slate-950/72 text-white'}`}>
                {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black text-white">Most Popular</span>}
                <h3 className="text-lg font-black">{plan.tier}</h3><p className="mt-1 text-xs text-white/55">{plan.name}</p>
                <div className="mt-4"><span className="text-4xl font-black">{plan.price}</span><span className="text-xs text-white/45">{plan.period}</span></div>
                <ul className="mt-5 flex-1 space-y-2 text-[12px] text-white/76">{plan.bullets.slice(0, 6).map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-300" />{x}</li>)}</ul>
                <Link href={plan.href} className="mt-5 rounded-xl border border-white/20 bg-white/[.08] px-4 py-2.5 text-center text-xs font-black text-white">{plan.cta}</Link>
              </article>
            ))}
          </div>

          <details className={styles.comparison}>
            <summary className="cursor-pointer px-5 py-4 font-bold">Compare all plan features</summary>
            <div className="border-b border-slate-200/70 px-5 py-4"><h3 className="text-lg font-black">Plan comparison</h3><p className="text-xs text-slate-600">Current configured limits and included features.</p></div>
            <div className="overflow-x-auto"><table className="min-w-[780px] w-full text-left text-xs"><thead><tr className="bg-slate-900 text-white"><th className="px-4 py-3">Feature</th>{PLANS.map((p) => <th key={p.id} className="px-4 py-3 text-center">{p.tier}</th>)}</tr></thead><tbody>{comparisonRows.map((row, i) => <tr key={row[0]} className={i % 2 ? 'bg-white/70' : 'bg-slate-50/70'}><th className="px-4 py-3 font-bold">{row[0]}</th>{row.slice(1).map((v, idx) => <td key={`${row[0]}-${idx}`} className="px-4 py-3 text-center text-slate-700">{v}</td>)}</tr>)}</tbody></table></div>
          </details>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 text-center sm:px-8 lg:px-10">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-950">Ideas build brighter worlds</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Turn an idea into something real.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-700">Start with a prompt, template, or blank project. The tools are ready.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3"><Link href={primaryHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 text-sm font-black text-white">Start Building Free <Rocket className="h-4 w-4" /></Link><Link href="/wonder-build" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white/75 px-5 text-sm font-bold">Explore Templates</Link></div>
        </section>
      </div>
    </main>
  );
}