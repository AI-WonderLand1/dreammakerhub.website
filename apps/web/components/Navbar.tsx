'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
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

const PRODUCT_MENUS = [
  {
    key: 'build',
    label: 'Build',
    product: 'WonderBuild',
    href: '/wonder-build',
    icon: WandSparkles,
    description: 'Go from template or prompt to a real website or app.',
    items: [
      {
        label: 'WonderBuild Home',
        href: '/wonder-build',
        description: 'Choose a template, generate with AI, or start blank.',
      },
      {
        label: 'Create & Edit',
        description: 'Choose how you want to enter the builder.',
        children: [
          {
            label: 'Template Library',
            href: '/wonder-build',
            description: 'Pick the real template that becomes your project.',
          },
          {
            label: 'Visual Builder',
            href: '/wonder-build/builder',
            description: 'AI, drag-and-drop, code, preview, and publish.',
          },
        ],
      },
    ],
  },
  {
    key: 'code',
    label: 'Code',
    product: 'WonderSpace',
    href: '/wonderspace',
    icon: Code2,
    description: 'Private cloud coding with files, Git, terminal, and AI.',
    items: [
      {
        label: 'WonderSpace',
        href: '/wonderspace',
        description: 'Open your cloud IDE and work with real project files.',
      },
      {
        label: 'AI & Developer Tools',
        description: 'Models, prompts, providers, modules, and APIs.',
        children: [
          {
            label: 'AI Playground',
            href: 'https://playground.dreammakerhub.website/',
            description: 'Test models, prompts, providers, and agent workflows.',
            external: true,
          },
          {
            label: 'AI Modules',
            href: '/ai-modules',
            description: 'Browse and use the platform AI modules.',
          },
          {
            label: 'API Reference',
            href: '/api-reference',
            description: 'Developer-facing API documentation and references.',
          },
        ],
      },
    ],
  },
  {
    key: '3d',
    label: '3D',
    product: 'WonderPlay',
    href: '/dashboard/3dhub',
    icon: Cuboid,
    description: 'Build worlds, interactive experiences, assets, and NPCs.',
    items: [
      {
        label: 'WonderPlay',
        href: '/dashboard/3dhub',
        description: 'Start and manage realtime 3D projects.',
      },
      {
        label: '3D Tools',
        description: 'Assets, command-line tools, and intelligent characters.',
        children: [
          {
            label: '3D Library',
            href: '/3d-library',
            description: 'Browse your 3D assets and creation resources.',
          },
          {
            label: '3D CLI',
            href: '/3d-cli',
            description: 'Use DreamMakerHub 3D tooling from the command line.',
          },
          {
            label: 'NPC-AI-SIM',
            href: '/wonder-play',
            description: 'Create, configure, and test intelligent characters.',
          },
        ],
      },
    ],
  },
] as const;

const DIRECT_LINKS = [
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) => {
    if (href.startsWith('http') || href.includes('#')) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const productIsActive = (key: string) => {
    if (key === 'build') return pathname.startsWith('/wonder-build');
    if (key === 'code') return pathname.startsWith('/wonderspace') || pathname.startsWith('/ai-modules') || pathname.startsWith('/api-reference');
    if (key === '3d') return pathname.startsWith('/dashboard/3dhub') || pathname.startsWith('/wonder-play') || pathname.startsWith('/3d-library') || pathname.startsWith('/3d-cli');
    return false;
  };

  const closeMenus = () => {
    setMobileOpen(false);
    setOpenMenu(null);
    setOpenSubmenu(null);
    setMobileSection(null);
    setMobileSubmenu(null);
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
          <span className="grid h-9 w-9 place-items-center rounded-full border border-cyan-300/25 bg-[radial-gradient(circle_at_35%_30%,#22d3ee,transparent_25%),conic-gradient(from_180deg,#7c3aed,#06b6d4,#7c3aed)] shadow-[0_0_22px_rgba(34,211,238,.18)]">
            <span className="h-4 w-4 rounded-full border-2 border-white/80" />
          </span>
          <span className="hidden min-[430px]:block">
            <span className="block text-[16px] font-black tracking-tight text-white">Dream<span className="text-violet-300">Maker</span><span className="text-cyan-300">Hub</span></span>
            <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[.16em] text-white/35">Create · Build · Explore · Together</span>
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {PRODUCT_MENUS.map((menu) => {
            const MenuIcon = menu.icon;
            const menuOpen = openMenu === menu.key;
            const active = productIsActive(menu.key);

            return (
              <div
                key={menu.key}
                className="relative"
                onMouseEnter={() => {
                  setOpenMenu(menu.key);
                  setOpenSubmenu(null);
                }}
                onMouseLeave={() => {
                  setOpenMenu(null);
                  setOpenSubmenu(null);
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenu(menuOpen ? null : menu.key);
                    setOpenSubmenu(null);
                  }}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold transition ${active || menuOpen ? 'bg-white/10 text-white' : 'text-white/72 hover:bg-white/[.06] hover:text-white'}`}
                >
                  {menu.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 top-full pt-3">
                    <div className="w-[350px] rounded-2xl border border-white/12 bg-[#07111f]/98 p-2 shadow-[0_28px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl">
                      <Link
                        href={menu.href}
                        onClick={closeMenus}
                        className="mb-2 flex items-start gap-3 rounded-xl border border-cyan-300/10 bg-gradient-to-br from-violet-500/12 to-cyan-500/8 p-3 transition hover:border-cyan-300/20 hover:bg-white/[.06]"
                      >
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/15">
                          <MenuIcon className="h-4 w-4 text-cyan-300" />
                        </span>
                        <span>
                          <span className="block text-sm font-black text-white">{menu.product}</span>
                          <span className="mt-1 block text-[11px] leading-4 text-white/45">{menu.description}</span>
                        </span>
                      </Link>

                      {menu.items.map((item) => {
                        if ('children' in item) {
                          const submenuKey = `${menu.key}:${item.label}`;
                          const submenuOpen = openSubmenu === submenuKey;

                          return (
                            <div
                              key={item.label}
                              className="relative"
                              onMouseEnter={() => setOpenSubmenu(submenuKey)}
                              onMouseLeave={() => setOpenSubmenu(null)}
                            >
                              <button
                                type="button"
                                onClick={() => setOpenSubmenu(submenuOpen ? null : submenuKey)}
                                aria-expanded={submenuOpen}
                                aria-haspopup="menu"
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${submenuOpen ? 'bg-violet-500/12' : 'hover:bg-white/[.05]'}`}
                              >
                                <span>
                                  <span className="block text-xs font-bold text-white/82">{item.label}</span>
                                  <span className="mt-1 block text-[10px] leading-4 text-white/35">{item.description}</span>
                                </span>
                                <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-cyan-300/70" />
                              </button>

                              {submenuOpen && (
                                <div className="absolute left-full top-0 pl-2">
                                  <div className="w-[330px] rounded-2xl border border-violet-300/15 bg-[#091425]/98 p-2 shadow-[0_28px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl">
                                    {item.children.map((child) => (
                                      <Link
                                        key={child.href}
                                        href={child.href}
                                        target={'external' in child && child.external ? '_blank' : undefined}
                                        rel={'external' in child && child.external ? 'noreferrer' : undefined}
                                        onClick={closeMenus}
                                        className="block rounded-xl px-3 py-3 transition hover:bg-white/[.06]"
                                      >
                                        <span className="block text-xs font-bold text-white/82">{child.label}</span>
                                        <span className="mt-1 block text-[10px] leading-4 text-white/35">{child.description}</span>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link key={item.href} href={item.href} onClick={closeMenus} className="block rounded-xl px-3 py-3 transition hover:bg-white/[.05]">
                            <span className="block text-xs font-bold text-white/82">{item.label}</span>
                            <span className="mt-1 block text-[10px] leading-4 text-white/35">{item.description}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {DIRECT_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenus}
              className={`rounded-lg px-3 py-2 text-[13px] font-bold transition ${isActive(href) ? 'bg-white/10 text-white' : 'text-white/72 hover:bg-white/[.06] hover:text-white'}`}
            >
              {label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => {
              setOpenMenu('about');
              setOpenSubmenu(null);
            }}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'about' ? null : 'about')}
              aria-expanded={openMenu === 'about'}
              aria-haspopup="menu"
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold transition ${openMenu === 'about' ? 'bg-violet-500/18 text-cyan-200 ring-1 ring-violet-400/20' : 'text-cyan-200 hover:bg-white/[.06]'}`}
            >
              About
              <ChevronDown className={`h-3.5 w-3.5 transition ${openMenu === 'about' ? 'rotate-180' : ''}`} />
            </button>

            {openMenu === 'about' && (
              <div className="absolute right-0 top-full pt-3">
                <div className="grid w-[min(1050px,calc(100vw-40px))] grid-cols-[1fr_1fr_1fr_280px] overflow-hidden rounded-2xl border border-violet-300/20 bg-[#07111f]/98 shadow-[0_30px_90px_rgba(0,0,0,.58)] backdrop-blur-2xl">
                  {ABOUT_COLUMNS.map((column) => (
                    <section key={column.title} className="border-r border-white/10 p-5">
                      <h2 className="text-sm font-black text-white">{column.title}</h2>
                      <p className="mt-1 text-[10px] leading-4 text-white/35">{column.subtitle}</p>
                      <div className="mt-4 grid gap-1">
                        {column.items.map(({ label, href, icon: Icon, ...rest }) => (
                          <Link
                            key={`${label}-${href}`}
                            href={href}
                            target={'external' in rest && rest.external ? '_blank' : undefined}
                            rel={'external' in rest && rest.external ? 'noreferrer' : undefined}
                            onClick={closeMenus}
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold text-white/72 transition hover:bg-violet-500/10 hover:text-white"
                          >
                            <Icon className="h-4 w-4 text-violet-300" />
                            {label}
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}

                  <section className="relative min-h-[250px] overflow-hidden bg-[linear-gradient(160deg,rgba(76,29,149,.46),rgba(8,47,73,.62))] p-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(34,211,238,.4),transparent_28%),radial-gradient(circle_at_30%_80%,rgba(168,85,247,.45),transparent_34%)] opacity-40" />
                    <div className="relative flex h-full flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">DreamMakerHub</p>
                        <h3 className="mt-3 text-2xl font-black leading-tight text-white">Ideas build brighter worlds.</h3>
                        <p className="mt-2 text-xs leading-5 text-white/55">Learn what we are building and why the platform exists.</p>
                      </div>
                      <Link href="/about" onClick={closeMenus} className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-violet-300/25 bg-violet-500/15 px-4 py-2 text-xs font-black text-white">
                        Explore our story <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link href="/docs" aria-label="Search documentation" className="grid h-9 w-9 place-items-center rounded-lg text-white/65 transition hover:bg-white/[.06] hover:text-white">
            <Search className="h-4 w-4" />
          </Link>
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/12 bg-white/[.05] px-3 text-xs font-bold text-white/80">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-white/45 hover:bg-red-500/10 hover:text-red-200">
                <LogOut className="h-4 w-4" /> {signingOut ? '...' : 'Sign out'}
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/public-pages/auth" className="inline-flex h-9 items-center rounded-lg border border-white/20 px-4 text-xs font-bold text-white/85">Sign In</Link>
              <Link href="/public-pages/auth?signup=true" className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-xs font-black text-white shadow-[0_8px_22px_rgba(79,70,229,.28)]">Start Building</Link>
            </>
          ) : (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-white/[.06]" />
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/10 bg-[#050b16]/98 px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {PRODUCT_MENUS.map((menu) => {
              const Icon = menu.icon;
              const sectionOpen = mobileSection === menu.key;

              return (
                <div key={menu.key} className="rounded-xl border border-transparent data-[open=true]:border-white/10" data-open={sectionOpen}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSection(sectionOpen ? null : menu.key);
                      setMobileSubmenu(null);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white/80 hover:bg-white/[.05]"
                  >
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-cyan-300" />{menu.label}</span>
                    <ChevronDown className={`h-4 w-4 transition ${sectionOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {sectionOpen && (
                    <div className="mx-2 mb-2 rounded-xl border border-white/10 bg-white/[.025] p-2">
                      <Link href={menu.href} onClick={closeMenus} className="block rounded-lg px-3 py-3 hover:bg-white/[.05]">
                        <span className="block text-sm font-black text-white">{menu.product}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-white/40">{menu.description}</span>
                      </Link>

                      {menu.items.map((item) => {
                        if ('children' in item) {
                          const submenuKey = `${menu.key}:${item.label}`;
                          const submenuOpen = mobileSubmenu === submenuKey;

                          return (
                            <div key={item.label}>
                              <button
                                type="button"
                                onClick={() => setMobileSubmenu(submenuOpen ? null : submenuKey)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-white/[.05]"
                              >
                                <span>
                                  <span className="block text-sm font-bold text-white/72">{item.label}</span>
                                  <span className="mt-1 block text-[10px] leading-4 text-white/35">{item.description}</span>
                                </span>
                                <ChevronRight className={`h-4 w-4 shrink-0 text-cyan-300/70 transition ${submenuOpen ? 'rotate-90' : ''}`} />
                              </button>

                              {submenuOpen && (
                                <div className="ml-4 border-l border-violet-300/15 pl-2">
                                  {item.children.map((child) => (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      target={'external' in child && child.external ? '_blank' : undefined}
                                      rel={'external' in child && child.external ? 'noreferrer' : undefined}
                                      onClick={closeMenus}
                                      className="block rounded-lg px-3 py-3 hover:bg-white/[.05]"
                                    >
                                      <span className="block text-sm font-semibold text-white/68">{child.label}</span>
                                      <span className="mt-1 block text-[10px] leading-4 text-white/32">{child.description}</span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link key={item.href} href={item.href} onClick={closeMenus} className="block rounded-lg px-3 py-3 hover:bg-white/[.05]">
                            <span className="block text-sm font-bold text-white/72">{item.label}</span>
                            <span className="mt-1 block text-[10px] leading-4 text-white/35">{item.description}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {DIRECT_LINKS.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={closeMenus} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white/70 hover:bg-white/[.05] hover:text-white">
                <Icon className="h-4 w-4 text-cyan-300" />{label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setMobileSection(mobileSection === 'about' ? null : 'about')}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white/80"
            >
              <span>About & Resources</span>
              <ChevronDown className={`h-4 w-4 transition ${mobileSection === 'about' ? 'rotate-180' : ''}`} />
            </button>

            {mobileSection === 'about' && (
              <div className="rounded-xl border border-white/10 bg-white/[.025] p-3">
                {ABOUT_COLUMNS.flatMap((column) => column.items).map(({ label, href, icon: Icon, ...rest }) => (
                  <Link
                    key={`${label}-${href}`}
                    href={href}
                    target={'external' in rest && rest.external ? '_blank' : undefined}
                    rel={'external' in rest && rest.external ? 'noreferrer' : undefined}
                    onClick={closeMenus}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/60 hover:bg-white/[.05] hover:text-white"
                  >
                    <Icon className="h-4 w-4" />{label}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:hidden">
              <Link href="/public-pages/auth" onClick={closeMenus} className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-white/75">Sign In</Link>
              <Link href="/public-pages/auth?signup=true" onClick={closeMenus} className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-center text-sm font-black text-white">Start Building</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
