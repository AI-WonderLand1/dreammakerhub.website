'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Box,
  Braces,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Gamepad2,
  Layers3,
  Menu,
  MonitorPlay,
  Package,
  Palette,
  Rocket,
  Search,
  Smartphone,
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
  { label: 'WonderSpace', href: '#wonderspace' },
  { label: 'AI', href: '#ai-editing' },
  { label: '3D', href: '#wonderplay' },
  { label: 'Cloud & Storage', href: '#projects' },
  { label: 'Developer', href: '#developer' },
  { label: 'Account', href: '#account' },
  { label: 'Help', href: '#help' },
] as const;

const navGroups: NavGroup[] = [
  {
    label: 'Getting Started',
    items: [
      { label: '1. Sign Up', href: '/docs/getting-started/sign-up' },
      { label: '2. Sign In', href: '/docs/getting-started/sign-in' },
      { label: '3. Start Your Project', href: '/docs/getting-started/start-your-project' },
      { label: 'Build a Website / App', href: '/docs/wonderbuild/start', indent: true },
      { label: 'Build with Code', href: '#wonderspace', indent: true },
      { label: 'Build a 3D Experience', href: '#wonderplay', indent: true },
      { label: 'Open an Existing Project', href: '#projects', indent: true },
    ],
  },
  {
    label: 'WonderBuild',
    items: [
      { label: 'WonderBuild Overview', href: '#wonderbuild' },
      { label: 'Choose a Template', href: '/docs/wonderbuild/start#template', indent: true },
      { label: 'Start with AI', href: '/docs/wonderbuild/start#ai', indent: true },
      { label: 'The Editor', href: '/docs/wonderbuild/editor', indent: true },
      { label: 'Pages', href: '#pages', indent: true },
      { label: 'Components', href: '#components', indent: true },
      { label: 'Content & CMS', href: '#content', indent: true },
      { label: 'Assets', href: '#assets', indent: true },
      { label: 'AI Editing', href: '#ai-editing', indent: true },
      { label: 'Responsive Design', href: '#responsive', indent: true },
      { label: 'Preview', href: '#preview', indent: true },
      { label: 'Publish', href: '#publish', indent: true },
    ],
  },
  {
    label: 'More Tools',
    items: [
      { label: 'WonderSpace', href: '#wonderspace' },
      { label: 'WonderPlay / 3D Hub', href: '#wonderplay' },
      { label: 'API Reference', href: '#developer' },
      { label: 'Tutorials', href: '#tutorials' },
      { label: 'FAQ & Help', href: '#help' },
    ],
  },
];

const onThisPage = [
  { label: 'Overview', href: '#overview' },
  { label: 'WonderBuild', href: '#wonderbuild' },
  { label: 'Pages', href: '#pages' },
  { label: 'Components', href: '#components' },
  { label: 'Content & CMS', href: '#content' },
  { label: 'Assets', href: '#assets' },
  { label: 'AI Editing', href: '#ai-editing' },
  { label: 'Responsive', href: '#responsive' },
  { label: 'Preview', href: '#preview' },
  { label: 'Publish', href: '#publish' },
];

const projectChoices = [
  {
    icon: Wand2,
    title: 'Website or App',
    description: 'Follow the WonderBuild docs for AI-assisted visual building, templates, pages, preview, and publishing.',
    href: '#wonderbuild',
    action: 'Read WonderBuild docs',
  },
  {
    icon: Code2,
    title: 'Code Project',
    description: 'Read how WonderSpace is used for files, terminal access, Git, and the cloud IDE workflow.',
    href: '#wonderspace',
    action: 'Read WonderSpace docs',
  },
  {
    icon: Box,
    title: '3D Experience',
    description: 'Read the current WonderPlay / 3D Hub workflow before opening the 3D tools.',
    href: '#wonderplay',
    action: 'Read 3D docs',
  },
  {
    icon: FolderOpen,
    title: 'Existing Project',
    description: 'Learn how saved projects are reopened and continued from the Projects dashboard.',
    href: '#projects',
    action: 'Read project docs',
  },
] as const;

const wonderBuildTopics = [
  {
    id: 'pages',
    icon: FileText,
    title: 'Pages',
    summary: 'Manage the pages that belong to one WonderBuild website without creating a second project.',
    steps: [
      'Open Pages from the left tool rail.',
      'Use the + button to create a new page. New pages start as “Untitled Page”.',
      'Click a page to make it active. WonderBuild swaps the canvas to that page’s saved elements.',
      'Double-click the page name, or use the pencil button, to rename it. Enter saves the name and Escape cancels the rename.',
      'Use Search pages to filter by page name or slug. The lower half of the Pages panel shows the active page layers.',
    ],
  },
  {
    id: 'components',
    icon: Layers3,
    title: 'Components',
    summary: 'Add building blocks to the canvas and reuse saved components from the same left-side tool area.',
    steps: [
      'Open Insert to browse blocks that can be placed on the page.',
      'Drag an available block onto the canvas or into a container that accepts children.',
      'Use Components to open saved or reusable components for the current project.',
      'Select the placed element on the canvas to edit it with the inspector, duplicate it, move it, resize it, or delete it.',
    ],
  },
  {
    id: 'content',
    icon: Palette,
    title: 'Content & CMS',
    summary: 'Edit a selected element directly, or use CMS when the content belongs in structured data instead of one manually placed block.',
    steps: [
      'Select an element on the canvas so the right inspector has a target.',
      'Use the Content inspector for the selected element’s editable content and design properties.',
      'Use Interactions when the selected element needs behavior instead of only visual changes.',
      'Open CMS from the left tool rail for structured content managed outside a single manually placed element.',
    ],
  },
  {
    id: 'assets',
    icon: Package,
    title: 'Assets',
    summary: 'Use the project asset library from either the left tool rail or the Assets shortcut in the top toolbar.',
    steps: [
      'Click Assets in the top toolbar or choose Assets from the left tool rail.',
      'The toolbar shortcut automatically returns the editor to Design mode and opens the Assets panel.',
      'Choose the project asset you need, then continue editing the placed element on the canvas.',
      'Treat inserted 3D media as website content: position it, size it, preview it, and publish it with the page rather than switching to a separate scene editor.',
    ],
  },
  {
    id: 'ai-editing',
    icon: Sparkles,
    title: 'AI Editing',
    summary: 'AI editing is tied to the selected element so changes have a clear target instead of modifying the whole project blindly.',
    steps: [
      'Select the element you want AI to work on.',
      'Open the AI option from the selected-element quick actions or the AI tab in the right inspector.',
      'Describe the change for that selection and review the result in the same editor.',
      'Use Undo if the generated change is not what you wanted.',
    ],
  },
  {
    id: 'responsive',
    icon: Smartphone,
    title: 'Responsive Design',
    summary: 'Check the same page at desktop, tablet, and mobile breakpoints without leaving the builder.',
    steps: [
      'Use Desktop, Tablet, or Mobile in the top toolbar to change the active canvas breakpoint.',
      'Adjust the canvas zoom when you need more or less working space.',
      'Toggle Grid when you want a visible layout guide.',
      'Toggle Snap when you want resizing to follow the 8-pixel grid and alignment guides.',
    ],
  },
  {
    id: 'preview',
    icon: Eye,
    title: 'Preview',
    summary: 'Switch from editing to the live preview mode using the Preview button in the top toolbar.',
    steps: [
      'Finish the current edit and click Preview in the top toolbar.',
      'WonderBuild switches the builder mode from Design or Code to Preview.',
      'Check layout, links, content, and the device widths you care about before publishing.',
      'Return to Design when you need to change the canvas again.',
    ],
  },
  {
    id: 'publish',
    icon: Rocket,
    title: 'Publish',
    summary: 'Publish the complete saved WonderBuild site, or export the current work instead.',
    steps: [
      'Click Publish in the top toolbar to open the Publish modal.',
      'Choose Publish Site to publish every page, including page names, slugs, page content, and the project theme.',
      'Choose Active HTML when you only need the current page exported as HTML.',
      'Choose Site JSON when you want the current WonderBuild site state exported as JSON.',
      'A site publish requires a saved project ID. If the project has not been saved as a project yet, WonderBuild tells you to save it first.',
    ],
  },
] as const;

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
              {group.items.map((item) => (
                <Link
                  key={`${group.label}-${item.label}`}
                  href={item.href}
                  onClick={onNavigate}
                  className={`block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white ${
                    item.indent ? 'ml-4 border-l border-slate-800 pl-4' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </nav>
  );
}

function TopicSection({ topic }: { topic: (typeof wonderBuildTopics)[number] }) {
  const Icon = topic.icon;
  return (
    <section id={topic.id} className="scroll-mt-36 border-t border-slate-200 pt-14">
      <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
            <Icon className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight">{topic.title}</h2>
          <p className="mt-3 leading-7 text-slate-600">{topic.summary}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">How it works now</p>
          <ol className="mt-4 space-y-4">
            {topic.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
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
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
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
              <span className="font-medium text-slate-700">Overview</span>
            </div>

            <section id="overview" className="scroll-mt-36">
              <div className="mb-8 max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4" /> Documentation home
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Build with DreamMakerHub without leaving the docs by accident</h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  The documentation navigation stays inside documentation. Product-launch buttons are labeled separately, so reading the next step no longer throws you into an editor or dashboard.
                </p>
              </div>

              <div id="account" className="grid scroll-mt-36 gap-4 md:grid-cols-3">
                <Link href="/docs/getting-started/sign-up" className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><UserPlus className="h-5 w-5" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Step 1</span>
                  </div>
                  <h2 className="text-lg font-bold">Sign Up</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Read the account-creation instructions first.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Read Sign Up docs <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>

                <Link href="/docs/getting-started/sign-in" className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><ArrowRight className="h-5 w-5" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Step 2</span>
                  </div>
                  <h2 className="text-lg font-bold">Sign In</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Read the sign-in and session instructions without leaving Docs.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Read Sign In docs <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>

                <Link href="/docs/getting-started/start-your-project" className="group rounded-2xl border border-blue-300 bg-blue-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><Wand2 className="h-5 w-5" /></span>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-500">Step 3</span>
                  </div>
                  <h2 className="text-lg font-bold">Start Your Project</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose the right builder from the documentation before opening the product.</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Read project-start docs <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
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
                    <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Website and web-app builder</h2>
                    <p className="mt-4 leading-7 text-slate-300">Start blank, from a template, or with AI. All three paths lead to the same WonderBuild editor, where pages, components, content, assets, AI edits, responsive controls, preview, and publishing live together.</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link href="/docs/wonderbuild/start" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold transition hover:bg-blue-500">Read Start docs <ArrowRight className="h-4 w-4" /></Link>
                      <Link href="/docs/wonderbuild/editor" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:bg-white/5">Read Editor docs <ArrowRight className="h-4 w-4" /></Link>
                      <Link href="/wonder-build" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:bg-white/5">Open WonderBuild <ExternalLink className="h-4 w-4" /></Link>
                    </div>
                  </div>
                  <div className="relative min-h-[330px] bg-slate-900 p-5 lg:min-h-[410px]">
                    <img src="/docs/wonderbuild-editor.svg" alt="WonderBuild visual editor with pages, canvas, and properties panels" className="h-full w-full rounded-2xl object-cover object-center" />
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-16 space-y-14">
              {wonderBuildTopics.map((topic) => <TopicSection key={topic.id} topic={topic} />)}
            </div>

            <section id="wonderspace" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-7 sm:p-8">
                <Code2 className="h-8 w-8 text-blue-700" />
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-blue-700">WonderSpace</p>
                <h2 className="mt-2 text-3xl font-black">Code projects and cloud development</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">WonderSpace is the code-project path. The current project documentation describes it as the place for project files, terminal access, Git, a VS Code-style cloud IDE, and AI-assisted coding. Opening WonderSpace launches the workspace flow rather than the visual website builder.</p>
                <Link href="/wonderspace" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-600">Open WonderSpace <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </section>

            <section id="wonderplay" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 sm:p-8">
                <Gamepad2 className="h-8 w-8 text-cyan-700" />
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">WonderPlay / 3D Hub</p>
                <h2 className="mt-2 text-3xl font-black">3D, panoramas, games, and movie tools</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">The current 3D Hub documentation lists 3D Factory, 360 View, Game Builder, and Movie Maker as the major studio areas. Use this path when the project itself is 3D-focused. A 3D asset used inside WonderBuild is still treated as page content and does not require leaving WonderBuild for a scene editor.</p>
                <Link href="/dashboard/3dhub" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-600">Open 3D Hub <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </section>

            <section id="projects" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-8">
                <FolderOpen className="h-8 w-8 text-slate-800" />
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Projects</p>
                <h2 className="mt-2 text-3xl font-black">Continue a project you already started</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">Use the Projects dashboard when the project already exists. The current flow lists saved projects and provides actions for opening the editor or related project destinations instead of forcing you through the new-project start flow again.</p>
                <Link href="/dashboard/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Open My Projects <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </section>

            <section id="developer" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-violet-200 bg-violet-50 p-7 sm:p-8">
                <Braces className="h-8 w-8 text-violet-700" />
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Developer</p>
                <h2 className="mt-2 text-3xl font-black">API reference is a separate reference surface</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">The Docs navigation now brings you here first instead of silently routing you away. Use the explicit button below when you actually want to open the API Reference.</p>
                <Link href="/api-reference" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-600">Open API Reference <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </section>

            <section id="tutorials" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-slate-200 p-7 sm:p-8">
                <MonitorPlay className="h-8 w-8 text-blue-700" />
                <h2 className="mt-4 text-3xl font-black">Tutorials</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">Tutorials are the visual walkthrough library. This Docs menu keeps you on this page; the button below opens that separate library only when you choose to leave the documentation page.</p>
                <Link href="/tutorials" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50">Open Tutorials <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </section>

            <section id="help" className="scroll-mt-36 pt-16">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 sm:p-8">
                <CircleHelp className="h-8 w-8 text-amber-700" />
                <h2 className="mt-4 text-3xl font-black">Help and troubleshooting</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-700">Feature-specific problems belong beside the feature instructions so users do not have to hunt through unrelated pages. The FAQ remains available as a separate destination for broader questions.</p>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><h3 className="font-bold">Page did not switch</h3><p className="mt-1 text-sm leading-6 text-slate-600">Confirm you clicked a page in the Pages panel and that it became the active page before editing the canvas.</p></div>
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><h3 className="font-bold">Preview looks wrong</h3><p className="mt-1 text-sm leading-6 text-slate-600">Return to Design, check Desktop / Tablet / Mobile, then reopen Preview.</p></div>
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><h3 className="font-bold">Publish says save first</h3><p className="mt-1 text-sm leading-6 text-slate-600">Site publishing requires a saved project ID. Save the work as a project, then reopen Publish.</p></div>
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><h3 className="font-bold">Need general help</h3><p className="mt-1 text-sm leading-6 text-slate-600">Open the FAQ for questions that are not tied to one editor feature.</p></div>
                </div>
                <Link href="/faq" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-bold text-amber-900 hover:border-amber-500">Open FAQ <ExternalLink className="h-4 w-4" /></Link>
              </div>
            </section>

            <section className="mt-16 border-t border-slate-200 pt-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Was this page helpful?</p>
                  <p className="mt-1 text-sm text-slate-500">Use this to mark whether the overview was useful.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFeedback('yes')} className={`grid h-11 w-12 place-items-center rounded-xl border transition ${feedback === 'yes' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`} aria-label="This page was helpful"><ThumbsUp className="h-5 w-5" /></button>
                  <button onClick={() => setFeedback('no')} className={`grid h-11 w-12 place-items-center rounded-xl border transition ${feedback === 'no' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`} aria-label="This page was not helpful"><ThumbsDown className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link href="/docs/getting-started/sign-in" className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous</span>
                  <p className="mt-2 font-bold">Sign in documentation</p>
                </Link>
                <Link href="/docs/wonderbuild/start" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-right transition hover:border-blue-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Next</span>
                  <p className="mt-2 font-bold text-blue-900">Start a WonderBuild project →</p>
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
              <a href="#help" className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"><CircleHelp className="h-4 w-4" /> Help</a>
              <a href="#tutorials" className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"><MonitorPlay className="h-4 w-4" /> Tutorials</a>
              <a href="#developer" className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"><Code2 className="h-4 w-4" /> API Reference info</a>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-4">
            <Cloud className="h-5 w-5 text-blue-600" />
            <p className="mt-3 text-sm font-bold">Docs navigation stays in Docs</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Only buttons explicitly labeled to open the app, API reference, tutorial library, or FAQ leave this documentation page.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
