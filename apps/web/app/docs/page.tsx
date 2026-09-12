'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Box,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  Code2,
  ExternalLink,
  FolderOpen,
  Menu,
  MonitorPlay,
  Play,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Wand2,
  X,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  indent?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const topTabs = [
  { label: 'Overview', href: '#overview' },
  { label: 'WonderBuild', href: '#wonderbuild' },
  { label: 'WonderSpace', href: '#start-project' },
  { label: 'AI', href: '#start-project' },
  { label: '3D', href: '#start-project' },
  { label: 'Cloud & Storage', href: '#build-project' },
  { label: 'Developer', href: '/api-reference' },
  { label: 'Account', href: '#sign-up' },
  { label: 'Help', href: '/faq' },
] as const;

const navGroups: NavGroup[] = [
  {
    label: 'Getting Started',
    items: [
      { label: '1. Sign Up', href: '#sign-up' },
      { label: '2. Sign In', href: '#sign-in' },
      { label: '3. Start Your Project', href: '#start-project' },
      { label: 'Build a Website / App', href: '#wonderbuild', indent: true },
      { label: 'Build with Code', href: '/wonderspace', indent: true },
      { label: 'Build a 3D Experience', href: '/dashboard/3dhub', indent: true },
      { label: 'Open an Existing Project', href: '/dashboard/projects', indent: true },
    ],
  },
  {
    label: 'Build Your Project',
    items: [
      { label: 'WonderBuild Overview', href: '#wonderbuild' },
      { label: 'Choose a Template', href: '#ways-to-start', indent: true },
      { label: 'Start with AI', href: '#ways-to-start', indent: true },
      { label: 'The Editor', href: '#editor', indent: true },
      { label: 'Pages', href: '#build-project', indent: true },
      { label: 'Components', href: '#build-project', indent: true },
      { label: 'Content', href: '#build-project', indent: true },
      { label: 'Assets', href: '#build-project', indent: true },
      { label: 'AI Editing', href: '#build-project', indent: true },
      { label: 'Responsive Design', href: '#build-project', indent: true },
      { label: 'Preview', href: '#build-project', indent: true },
      { label: 'Publish', href: '#build-project', indent: true },
    ],
  },
  {
    label: 'More Tools',
    items: [
      { label: 'WonderSpace', href: '/wonderspace' },
      { label: '3D Hub', href: '/dashboard/3dhub' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'Tutorials', href: '/tutorials' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
];

const onThisPage = [
  { label: 'Overview', href: '#overview' },
  { label: 'Sign up', href: '#sign-up' },
  { label: 'Sign in', href: '#sign-in' },
  { label: 'Start your project', href: '#start-project' },
  { label: 'WonderBuild', href: '#wonderbuild' },
  { label: 'Ways to start', href: '#ways-to-start' },
  { label: 'Step-by-step', href: '#step-by-step' },
  { label: 'If something goes wrong', href: '#troubleshooting' },
];

const projectChoices = [
  {
    icon: Wand2,
    title: 'Website or App',
    description: 'Use WonderBuild for AI-assisted visual building, templates, pages, preview, and publishing.',
    href: '/wonder-build',
    action: 'Open WonderBuild',
  },
  {
    icon: Code2,
    title: 'Code Project',
    description: 'Use WonderSpace when you want direct code, project files, terminal access, and development tools.',
    href: '/wonderspace',
    action: 'Open WonderSpace',
  },
  {
    icon: Box,
    title: '3D Experience',
    description: 'Use the 3D Hub for spatial projects, 3D assets, previews, and related creative tools.',
    href: '/dashboard/3dhub',
    action: 'Open 3D Hub',
  },
  {
    icon: FolderOpen,
    title: 'Existing Project',
    description: 'Return to a project you already started and continue from your projects dashboard.',
    href: '/dashboard/projects',
    action: 'View Projects',
  },
] as const;

const buildTopics = [
  'Editor basics',
  'Pages',
  'Components',
  'Text & content',
  'Images & assets',
  'AI editing',
  'Design controls',
  'Responsive layout',
  'Preview',
  'Publish',
];

function DocsLogo() {
  return (
    <Link href="/docs" className="flex items-center gap-3 font-bold tracking-tight text-white">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
        <BookOpen className="h-5 w-5" />
      </span>
      <span className="text-lg sm:text-xl">DreamMakerHub</span>
      <span className="hidden text-sm font-medium text-slate-400 sm:inline">Docs</span>
    </Link>
  );
}

function Sidebar({ search, onNavigate }: { search: string; onNavigate?: () => void }) {
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return navGroups;

    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(query)),
      }))
      .filter((group) => group.items.length > 0 || group.label.toLowerCase().includes(query));
  }, [search]);

  return (
    <nav className="space-y-8 pb-16" aria-label="Documentation navigation">
      {groups.length === 0 ? (
        <p className="px-3 text-sm text-slate-500">No documentation matches “{search}”.</p>
      ) : (
        groups.map((group) => (
          <section key={group.label}>
            <div className="mb-2 flex items-center justify-between px-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</h2>
              <ChevronDown className="h-4 w-4 text-slate-600" />
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const externalToDocs = item.href.startsWith('/') && !item.href.startsWith('/docs');
                return (
                  <Link
                    key={`${group.label}-${item.label}`}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      item.label === '3. Start Your Project' || item.label === 'WonderBuild Overview'
                        ? 'bg-blue-600/15 font-semibold text-blue-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    } ${item.indent ? 'ml-4 border-l border-slate-800 pl-4' : ''}`}
                  >
                    <span>{item.label}</span>
                    {externalToDocs ? (
                      <ExternalLink className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </nav>
  );
}

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-blue-200 dark:bg-slate-950 dark:text-slate-50">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 text-white backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-7">
          <button
            type="button"
            aria-label="Open documentation menu"
            onClick={() => setMobileNavOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-300 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <DocsLogo />

          <div className="mx-auto hidden w-full max-w-xl md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documentation..."
                className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-16 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-400">Ctrl K</span>
            </label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/projects" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:flex">
              Go to App <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href="/public-pages/auth" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
              Sign In
            </Link>
          </div>
        </div>

        <div className="hidden h-11 items-center justify-center gap-1 overflow-x-auto border-t border-slate-900 px-4 lg:flex">
          {topTabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${
                tab.label === 'Overview'
                  ? 'border-blue-500 font-semibold text-blue-400'
                  : 'border-transparent text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 bg-black/70" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto border-r border-slate-800 bg-slate-950 p-5 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <DocsLogo />
              <button onClick={() => setMobileNavOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="relative mb-6 block md:hidden">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search docs..."
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <Sidebar search={search} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1800px] grid-cols-1 pt-16 lg:grid-cols-[280px_minmax(0,1fr)] lg:pt-[108px] xl:grid-cols-[280px_minmax(0,1fr)_240px]">
        <aside className="sticky top-[108px] hidden h-[calc(100vh-108px)] overflow-y-auto border-r border-slate-200 bg-slate-950 px-4 py-6 text-white lg:block dark:border-slate-800">
          <Sidebar search={search} />
        </aside>

        <main className="min-w-0 bg-white dark:bg-white dark:text-slate-950">
          <article className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/docs" className="hover:text-blue-600">Docs</Link>
              <ChevronRight className="h-4 w-4" />
              <span>Getting Started</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-slate-700">Start Your Project</span>
            </div>

            <section id="overview" className="scroll-mt-36">
              <div className="mb-8 max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4" /> Start here
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Build your first DreamMakerHub project</h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Follow the same path you use in the product: create your account, sign in, choose what you want to build, then follow the documentation for that builder from start to publish.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <a id="sign-up" href="/public-pages/auth" className="group scroll-mt-36 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><UserPlus className="h-5 w-5" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Step 1</span>
                  </div>
                  <h2 className="text-lg font-bold">Sign Up</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Create your account so projects, files, builder state, and publishing can be connected to you.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Create account <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </a>

                <a id="sign-in" href="/public-pages/auth" className="group scroll-mt-36 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><ArrowRight className="h-5 w-5" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Step 2</span>
                  </div>
                  <h2 className="text-lg font-bold">Sign In</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to open your project dashboard and continue work you already started.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Sign in <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </a>

                <a id="start-project" href="#choose-project" className="group scroll-mt-36 rounded-2xl border border-blue-300 bg-blue-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><Wand2 className="h-5 w-5" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-500">Step 3</span>
                  </div>
                  <h2 className="text-lg font-bold">Start Your Project</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose the actual DreamMakerHub tool that matches what you are trying to build.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Choose a builder <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </a>
              </div>
            </section>

            <section id="choose-project" className="scroll-mt-36 pt-16">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Start your project</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">What are you building?</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">Pick the project type first. Each builder gets its own detailed documentation instead of forcing every feature into one giant page.</p>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {projectChoices.map((choice) => {
                  const Icon = choice.icon;
                  return (
                    <Link key={choice.title} href={choice.href} className="group rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-md">
                      <div className="flex gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Icon className="h-6 w-6" /></span>
                        <div>
                          <h3 className="text-lg font-bold">{choice.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{choice.description}</p>
                          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">{choice.action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section id="wonderbuild" className="scroll-mt-36 pt-16">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-200/50">
                <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="flex flex-col justify-center p-7 text-white sm:p-9">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-400">WonderBuild</p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Turn an idea into a real website or app</h2>
                    <p className="mt-4 leading-7 text-slate-300">Start with AI, a template, or a blank project. Then use the visual editor, pages, components, assets, responsive controls, preview, and publishing workflow.</p>
                    <Link href="/wonder-build" className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500">
                      Start a WonderBuild Project <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="relative min-h-[330px] bg-slate-900 p-5 lg:min-h-[410px]">
                    <img src="/docs/wonderbuild-editor.svg" alt="WonderBuild visual editor with pages, canvas, and properties panels" className="h-full w-full rounded-2xl object-cover object-center" />
                  </div>
                </div>
              </div>
            </section>

            <section id="ways-to-start" className="scroll-mt-36 pt-14">
              <h2 className="text-3xl font-black tracking-tight">Ways to start</h2>
              <p className="mt-2 text-slate-600">Use the starting method that fits the project. You can change and customize the result afterward.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  ['Start with AI', 'Describe what you want and use AI to create the first version.', Sparkles],
                  ['Choose a Template', 'Start from a designed layout and customize the content and structure.', MonitorPlay],
                  ['Start Blank', 'Begin with an empty canvas when you want full control from the first element.', FolderOpen],
                ].map(([title, description, Icon]) => {
                  const IconComponent = Icon as typeof Sparkles;
                  return (
                    <Link key={title as string} href="/wonder-build" className="group rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/50">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                      <h3 className="mt-4 font-bold">{title as string}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{description as string}</p>
                      <ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section id="step-by-step" className="scroll-mt-36 pt-16">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Step-by-step</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">From project start to publish</h2>
                  <p className="mt-3 leading-7 text-slate-600">The deeper docs will split each stage into its own pages so users can learn one task at a time without losing the overall workflow.</p>

                  <div className="mt-7 space-y-5">
                    {[
                      ['1', 'Create your project', 'Open WonderBuild and choose how you want to start.'],
                      ['2', 'Build the first version', 'Use AI, a template, or a blank canvas.'],
                      ['3', 'Customize it', 'Work through pages, components, content, assets, AI edits, and design.'],
                      ['4', 'Preview everything', 'Check layout, links, desktop, tablet, and mobile before publishing.'],
                      ['5', 'Publish', 'Put the project live, then return whenever you need to update it.'],
                    ].map(([number, title, description]) => (
                      <div key={number} className="flex gap-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">{number}</span>
                        <div>
                          <h3 className="font-bold">{title}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/tutorials" className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-lg">
                  <div className="relative aspect-video overflow-hidden">
                    <img src="/docs/getting-started-video.svg" alt="DreamMakerHub getting started video preview" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                    <span className="absolute inset-0 grid place-items-center bg-slate-950/10">
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-blue-700 shadow-2xl transition group-hover:scale-110"><Play className="ml-1 h-7 w-7 fill-current" /></span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5 text-white">
                    <div>
                      <p className="font-bold">Watch the getting-started walkthrough</p>
                      <p className="mt-1 text-sm text-slate-400">Open the tutorial library for visual walkthroughs.</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-blue-400" />
                  </div>
                </Link>
              </div>
            </section>

            <section id="editor" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Build your project</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight">The big section becomes many focused pages</h2>
                    <p className="mt-3 leading-7 text-slate-600">Each topic gets screenshots, exact steps, what should happen next, and troubleshooting for the common ways it can fail.</p>
                  </div>
                  <Link href="/wonder-build" className="inline-flex items-center gap-2 font-bold text-blue-700">Open WonderBuild <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div id="build-project" className="mt-7 grid scroll-mt-36 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {buildTopics.map((topic, index) => (
                    <div key={topic} className="rounded-xl border border-slate-200 bg-white p-4">
                      <span className="text-xs font-black text-blue-600">{String(index + 1).padStart(2, '0')}</span>
                      <p className="mt-2 text-sm font-bold">{topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white"><CircleHelp className="h-6 w-6" /></span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">If this happens</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">Troubleshooting belongs on the page where the problem happens</h2>
                    <p className="mt-3 leading-7 text-slate-700">Publishing issues will be explained on publishing pages. Page problems will be explained on Pages pages. Asset failures will be handled with the asset instructions. Users should not have to leave the task they are doing just to discover how to fix it.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {[
                    ['The button is disabled', 'Explain what requirement is missing and exactly where to fix it.'],
                    ['Something did not save', 'Show save status, retry steps, and where to check project state.'],
                    ['Preview looks wrong', 'Walk through responsive settings, stale preview, and asset checks.'],
                    ['Publishing fails', 'Explain build errors, retry steps, rollback, and where to get help.'],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-xl border border-amber-200 bg-white/80 p-4">
                      <h3 className="font-bold text-slate-900">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-16 border-t border-slate-200 pt-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Was this page helpful?</p>
                  <p className="mt-1 text-sm text-slate-500">Feedback will help prioritize which docs need more screenshots and troubleshooting detail.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFeedback('yes')} className={`grid h-11 w-12 place-items-center rounded-xl border transition ${feedback === 'yes' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`} aria-label="This page was helpful"><ThumbsUp className="h-5 w-5" /></button>
                  <button onClick={() => setFeedback('no')} className={`grid h-11 w-12 place-items-center rounded-xl border transition ${feedback === 'no' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`} aria-label="This page was not helpful"><ThumbsDown className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link href="/public-pages/auth" className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous</span>
                  <p className="mt-2 font-bold">Sign in to DreamMakerHub</p>
                </Link>
                <Link href="/wonder-build" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-right transition hover:border-blue-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Next</span>
                  <p className="mt-2 font-bold text-blue-900">Start building with WonderBuild →</p>
                </Link>
              </div>
            </section>
          </article>
        </main>

        <aside className="sticky top-[108px] hidden h-[calc(100vh-108px)] border-l border-slate-200 bg-white px-5 py-8 xl:block">
          <p className="text-sm font-black text-slate-900">On this page</p>
          <nav className="mt-4 space-y-1 border-l border-slate-200 pl-4" aria-label="On this page">
            {onThisPage.map((item, index) => (
              <a key={item.label} href={item.href} className={`block py-1.5 text-sm transition hover:text-blue-700 ${index === 0 ? 'font-semibold text-blue-700' : 'text-slate-500'}`}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="font-bold">Need help?</p>
            <div className="mt-3 space-y-3 text-sm">
              <Link href="/faq" className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"><CircleHelp className="h-4 w-4" /> FAQ</Link>
              <Link href="/tutorials" className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"><MonitorPlay className="h-4 w-4" /> Tutorials</Link>
              <Link href="/api-reference" className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"><Code2 className="h-4 w-4" /> API Reference</Link>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-4">
            <Cloud className="h-5 w-5 text-blue-600" />
            <p className="mt-3 text-sm font-bold">Workflow-first docs</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Every major build system will get its own focused pages, screenshots, videos, next steps, and fixes.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
