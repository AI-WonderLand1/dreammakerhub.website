'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  BriefcaseBusiness,
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
  ShieldCheck,
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

const ABOUT_GROUPS = [
  {
    title: 'About DreamMakerHub',
    subtitle: 'The platform, the vision, the future',
    items: [
      { label: 'What is DreamMakerHub?', href: '/about', icon: FileText },
      { label: 'Roadmap', href: '/roadmap', icon: BriefcaseBusiness },
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
    subtitle: 'Learn, build, and connect',
    items: [
      { label: 'Docs & Guides', href: '/docs', icon: BookOpen },
      { label: 'Tutorials', href: '/tutorials', icon: FileText },
      { label: 'Community', href: '/community', icon: Users },
      { label: 'Blog', href: '/blog', icon: Newspaper },
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
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setMobileOpen(false);
      setAboutOpen(false);
      setSigningOut(false);
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#05070c]/90 shadow-[0_12px_40px_rgba(0,0,0,.28)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => { setMobileOpen(false); setAboutOpen(false); }} className="group flex min-w-0 shrink-0 items-center gap-3" aria-label="DreamMakerHub home">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-[radial-gradient(circle_at_70%_25%,rgba(34,211,238,.85),transparent_28%),linear-gradient(135deg,#7c3aed,#2563eb)] text-sm font-black text-white shadow-lg shadow-violet-950/30">D</span>
          <span className="hidden leading-none min-[430px]:block">
            <span className="block text-[15px] font-black tracking-tight text-white">Dream<span className="text-fuchsia-300">Maker</span><span className="text-cyan-300">Hub</span></span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">AI Wonderland Innovation</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {MAIN_LINKS.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} onClick={() => setAboutOpen(false)} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/20' : 'text-white/65 hover:bg-white/[0.055] hover:text-white'}`}>
                {label}
              </Link>
            );
          })}
          <div className="relative">
            <button type="button" onClick={() => setAboutOpen((open) => !open)} aria-expanded={aboutOpen} aria-haspopup="true" className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${aboutOpen ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/25' : 'text-white/65 hover:bg-white/[0.055] hover:text-white'}`}>
              About <ChevronDown className={`h-4 w-4 transition ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 text-sm font-semibold text-white/80 transition hover:border-violet-400/30 hover:bg-white/[0.09] hover:text-white"><LayoutDashboard size={15} /> Dashboard</Link>
              <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/45 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"><LogOut size={15} /> {signingOut ? 'Signing out…' : 'Sign out'}</button>
            </>
          ) : !loading ? (
            <>
              <Link href="/public-pages/auth" className="inline-flex h-10 items-center rounded-xl border border-white/10 px-3.5 text-sm font-semibold text-white/75 transition hover:bg-white/[0.055] hover:text-white">Sign in</Link>
              <Link href="/public-pages/auth?signup=true" className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110">Start Building</Link>
            </>
          ) : <div className="h-10 w-28 animate-pulse rounded-xl bg-white/[0.06]" />}
        </div>

        <button type="button" onClick={() => setMobileOpen((open) => !open)} className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-white/80 transition hover:bg-white/[0.06] sm:ml-0 xl:hidden" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {aboutOpen && (
        <div className="absolute left-1/2 top-16 hidden w-[min(1080px,calc(100vw-48px))] -translate-x-1/2 xl:block">
          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-violet-400/25 bg-[#07101f]/98 shadow-[0_30px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl">
            {ABOUT_GROUPS.map((group, index) => (
              <section key={group.title} className={`p-6 ${index < ABOUT_GROUPS.length - 1 ? 'border-r border-white/10' : ''}`}>
                <h2 className="text-base font-black text-white">{group.title}</h2>
                <p className="mt-1 text-xs text-white/40">{group.subtitle}</p>
                <div className="mt-5 grid gap-1.5">
                  {group.items.map(({ label, href, icon: Icon, ...item }) => (
                    <Link key={href} href={href} target={'external' in item && item.external ? '_blank' : undefined} rel={'external' in item && item.external ? 'noreferrer' : undefined} onClick={() => setAboutOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/70 transition hover:bg-violet-500/10 hover:text-white">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-violet-300"><Icon className="h-4 w-4" /></span>{label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#070a11]/98 px-4 py-4 shadow-2xl backdrop-blur-xl xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {MAIN_LINKS.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-violet-500/15 text-white' : 'text-white/65 hover:bg-white/[0.055] hover:text-white'}`}><Icon size={17} className={active ? 'text-violet-300' : 'text-white/35'} />{label}</Link>;
            })}

            <button type="button" onClick={() => setAboutOpen((open) => !open)} className="mt-1 flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/75 hover:bg-white/[0.055]">
              <span>About & Resources</span><ChevronDown className={`h-4 w-4 transition ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutOpen && (
              <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                {ABOUT_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-violet-300">{group.title}</p>
                    {group.items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => { setMobileOpen(false); setAboutOpen(false); }} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white"><Icon className="h-4 w-4" />{label}</Link>)}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 border-t border-white/10 pt-3 sm:hidden">
              {!loading && user ? (
                <div className="grid gap-2">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm font-bold text-white"><LayoutDashboard size={16} /> Open Dashboard</Link>
                  <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-red-200/75 hover:bg-red-500/10 disabled:opacity-50"><LogOut size={16} /> {signingOut ? 'Signing out…' : 'Sign out'}</button>
                </div>
              ) : !loading ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/public-pages/auth" onClick={() => setMobileOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white/75">Sign in</Link>
                  <Link href="/public-pages/auth?signup=true" onClick={() => setMobileOpen(false)} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-black">Start free</Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
