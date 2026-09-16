'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  ChevronDown,
  Code2,
  Cuboid,
  FileText,
  Github,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';

const MAIN_LINKS = [
  { label: 'Build', href: '/wonder-build', icon: WandSparkles },
  { label: 'Code', href: '/wonderspace', icon: Code2 },
  { label: '3D', href: '/dashboard/3dhub', icon: Cuboid },
  { label: 'Community', href: '/community', icon: Users },
  { label: 'Blog', href: '/blog', icon: Newspaper },
] as const;

const ABOUT_COLUMNS = [
  {
    title: 'About DreamMakerHub',
    subtitle: 'Your platform. Your vision. Then make it.',
    items: [
      { label: 'What is DreamMakerHub?', href: '/about', icon: FileText },
      { label: 'Our Mission', href: '/about', icon: Sparkles },
      { label: 'Pricing', href: '/#pricing', icon: Building2 },
    ],
  },
  {
    title: 'Company',
    subtitle: 'AI Wonderland Innovation',
    items: [
      { label: 'About the Company', href: '/about', icon: Building2 },
      { label: 'Contact', href: '/contact', icon: Mail },
      { label: 'Security', href: '/security', icon: ShieldCheck },
    ],
  },
  {
    title: 'Resources',
    subtitle: 'Learn, build, and grow',
    items: [
      { label: 'Docs & Guides', href: '/docs', icon: BookOpen },
      { label: 'Tutorials', href: '/tutorials', icon: FileText },
      { label: 'Community', href: '/community', icon: Users },
      { label: 'GitHub', href: 'https://github.com/AI-WonderLand1', icon: Github, external: true },
    ],
  },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) => {
    if (href.startsWith('http') || href.includes('#')) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setAboutOpen(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      closeMenus();
      setSigningOut(false);
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#030814]/88 shadow-[0_10px_30px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={closeMenus} className="flex shrink-0 items-center gap-3" aria-label="DreamMakerHub home">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/25 bg-[radial-gradient(circle_at_35%_30%,#22d3ee,transparent_25%),conic-gradient(from_180deg,#7c3aed,#06b6d4,#7c3aed)] shadow-[0_0_22px_rgba(34,211,238,.18)]"><span className="h-4 w-4 rounded-full border-2 border-white/80" /></span>
          <span className="hidden min-[430px]:block">
            <span className="block text-[16px] font-black tracking-tight text-white">Dream<span className="text-violet-300">Maker</span><span className="text-cyan-300">Hub</span></span>
            <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[.16em] text-white/35">Create · Build · Explore · Together</span>
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {MAIN_LINKS.map(({ label, href }) => (
            <Link key={href} href={href} onClick={() => setAboutOpen(false)} className={`rounded-lg px-3 py-2 text-[13px] font-bold transition ${isActive(href) ? 'bg-white/10 text-white' : 'text-white/72 hover:bg-white/[.06] hover:text-white'}`}>{label}</Link>
          ))}
          <button type="button" onClick={() => setAboutOpen((v) => !v)} aria-expanded={aboutOpen} aria-haspopup="true" className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold transition ${aboutOpen ? 'bg-violet-500/18 text-cyan-200 ring-1 ring-violet-400/20' : 'text-cyan-200 hover:bg-white/[.06]'}`}>About <ChevronDown className={`h-3.5 w-3.5 transition ${aboutOpen ? 'rotate-180' : ''}`} /></button>
        </div>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link href="/docs" aria-label="Search documentation" className="grid h-9 w-9 place-items-center rounded-lg text-white/65 transition hover:bg-white/[.06] hover:text-white"><Search className="h-4 w-4" /></Link>
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/12 bg-white/[.05] px-3 text-xs font-bold text-white/80"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
              <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-white/45 hover:bg-red-500/10 hover:text-red-200"><LogOut className="h-4 w-4" /> {signingOut ? '...' : 'Sign out'}</button>
            </>
          ) : !loading ? (
            <>
              <Link href="/public-pages/auth" className="inline-flex h-9 items-center rounded-lg border border-white/20 px-4 text-xs font-bold text-white/85">Sign In</Link>
              <Link href="/public-pages/auth?signup=true" className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-xs font-black text-white shadow-[0_8px_22px_rgba(79,70,229,.28)]">Start Building</Link>
            </>
          ) : <div className="h-9 w-24 animate-pulse rounded-lg bg-white/[.06]" />}
        </div>

        <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white lg:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>

      {aboutOpen && (
        <div className="absolute left-1/2 top-[68px] hidden w-[min(1050px,calc(100vw-40px))] -translate-x-1/2 lg:block">
          <div className="grid grid-cols-[1fr_1fr_1fr_280px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#07111f]/97 shadow-[0_30px_90px_rgba(0,0,0,.58)] backdrop-blur-2xl">
            {ABOUT_COLUMNS.map((column) => (
              <section key={column.title} className="border-r border-white/10 p-5">
                <h2 className="text-sm font-black text-white">{column.title}</h2>
                <p className="mt-1 text-[10px] leading-4 text-white/35">{column.subtitle}</p>
                <div className="mt-4 grid gap-1">
                  {column.items.map(({ label, href, icon: Icon, ...rest }) => (
                    <Link key={href} href={href} target={'external' in rest && rest.external ? '_blank' : undefined} rel={'external' in rest && rest.external ? 'noreferrer' : undefined} onClick={() => setAboutOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold text-white/72 transition hover:bg-violet-500/10 hover:text-white"><Icon className="h-4 w-4 text-violet-300" />{label}</Link>
                  ))}
                </div>
              </section>
            ))}

            <section className="relative min-h-[250px] overflow-hidden bg-[linear-gradient(160deg,rgba(76,29,149,.46),rgba(8,47,73,.62))] p-5">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_70%_25%,rgba(34,211,238,.4),transparent_28%),radial-gradient(circle_at_30%_80%,rgba(168,85,247,.45),transparent_34%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">DreamMakerHub</p><h3 className="mt-3 text-2xl font-black leading-tight text-white">Ideas build brighter worlds.</h3><p className="mt-2 text-xs leading-5 text-white/55">Learn what we are building and why the platform exists.</p></div>
                <Link href="/about" onClick={() => setAboutOpen(false)} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-300/25 bg-violet-500/15 px-4 py-2 text-xs font-black text-white">Explore our story <ArrowRightIcon /></Link>
              </div>
            </section>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#050b16]/98 px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {MAIN_LINKS.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={closeMenus} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white/70 hover:bg-white/[.05] hover:text-white"><Icon className="h-4 w-4 text-cyan-300" />{label}</Link>)}
            <button type="button" onClick={() => setAboutOpen((v) => !v)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white/80"><span>About & Resources</span><ChevronDown className={`h-4 w-4 transition ${aboutOpen ? 'rotate-180' : ''}`} /></button>
            {aboutOpen && <div className="rounded-xl border border-white/10 bg-white/[.025] p-3">{ABOUT_COLUMNS.flatMap((column) => column.items).map(({ label, href, icon: Icon, ...rest }) => <Link key={`${label}-${href}`} href={href} target={'external' in rest && rest.external ? '_blank' : undefined} onClick={closeMenus} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/60 hover:bg-white/[.05] hover:text-white"><Icon className="h-4 w-4" />{label}</Link>)}</div>}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:hidden"><Link href="/public-pages/auth" onClick={closeMenus} className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-white/75">Sign In</Link><Link href="/public-pages/auth?signup=true" onClick={closeMenus} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-center text-sm font-black text-white">Start Building</Link></div>
          </div>
        </div>
      )}
    </nav>
  );
}

function ArrowRightIcon() {
  return <span aria-hidden="true">→</span>;
}
