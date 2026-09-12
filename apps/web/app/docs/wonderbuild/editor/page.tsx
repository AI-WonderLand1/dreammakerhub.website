import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  LayoutPanelLeft,
  LayoutPanelTop,
  Monitor,
  MousePointer2,
  PanelRight,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'WonderBuild Editor Basics | DreamMakerHub Docs',
  description: 'Learn the WonderBuild editor layout, canvas, panels, responsive controls, saving, preview, and publishing workflow.',
};

const sidebarWonderBuild = [
  ['Start', '/docs/wonderbuild/start'],
  ['Editor Basics', '/docs/wonderbuild/editor'],
  ['Pages', '/docs#pages'],
  ['Components', '/docs#components'],
  ['Content & CMS', '/docs#content'],
  ['Assets', '/docs#assets'],
  ['AI Editing', '/docs#ai-editing'],
  ['Responsive Design', '/docs#responsive'],
  ['Preview', '/docs#preview'],
  ['Publish', '/docs#publish'],
] as const;

const toc = [
  ['Open the editor', '#open'],
  ['Editor layout', '#layout'],
  ['Top toolbar', '#toolbar'],
  ['Left tools', '#left-tools'],
  ['Canvas basics', '#canvas'],
  ['Right inspector', '#inspector'],
  ['Responsive controls', '#responsive'],
  ['Design, Code, and Preview', '#modes'],
  ['Save, undo, and shortcuts', '#saving'],
  ['Troubleshooting', '#troubleshooting'],
] as const;

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-black text-white">{number}</span>
      <div>
        <h3 className="font-bold text-slate-950">{title}</h3>
        <div className="mt-1 text-sm leading-6 text-slate-600">{children}</div>
      </div>
    </div>
  );
}

function ToolCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </div>
  );
}

export default function WonderBuildEditorDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link href="/docs" className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600">D</span>
            <span>DreamMakerHub <span className="font-medium text-slate-400">Docs</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/docs#wonderbuild" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 sm:inline-flex">WonderBuild Docs</Link>
            <Link href="/wonder-build" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500">Open WonderBuild <ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_230px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-r border-slate-800 px-4 py-7 lg:block">
          <p className="px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Getting Started</p>
          <nav className="mt-3 space-y-1 text-sm">
            <Link href="/docs/getting-started/sign-up" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">1. Sign Up</Link>
            <Link href="/docs/getting-started/sign-in" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">2. Sign In</Link>
            <Link href="/docs/getting-started/start-your-project" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">3. Start Your Project</Link>
          </nav>

          <p className="mt-8 px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">WonderBuild</p>
          <nav className="mt-3 space-y-1 text-sm">
            {sidebarWonderBuild.map(([label, href], index) => (
              <Link
                key={label}
                href={href}
                className={`block rounded-lg px-3 py-2 ${index === 1 ? 'bg-violet-500/15 font-semibold text-violet-300' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <p className="mt-8 px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Other Build Paths</p>
          <nav className="mt-3 space-y-1 text-sm text-slate-400">
            <Link href="/docs#wonderspace" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderSpace</Link>
            <Link href="/docs#wonderplay" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderPlay / 3D Hub</Link>
            <Link href="/docs#projects" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">Existing Projects</Link>
          </nav>
        </aside>

        <main className="min-w-0 bg-white text-slate-950">
          <article className="mx-auto max-w-5xl px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/docs" className="hover:text-blue-600">Docs</Link>
              <ChevronRight className="h-4 w-4" />
              <span>WonderBuild</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-slate-700">Editor Basics</span>
            </div>

            <div className="mt-7 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">
                <MousePointer2 className="h-4 w-4" /> WonderBuild · Build
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Learn the WonderBuild editor</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">The editor keeps Design, Code, Preview, Pages, Assets, Components, the selected-element inspector, responsive controls, and Publish in one workspace.</p>
            </div>

            <section id="open" className="scroll-mt-28 pt-12">
              <h2 className="text-3xl font-black tracking-tight">Open the editor</h2>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Start or reopen a project">Create one through <Link href="/docs/wonderbuild/start" className="font-semibold text-violet-700 underline underline-offset-4">WonderBuild Start docs</Link>, or reopen an existing project from My Projects.</Step>
                <Step number={2} title="Wait for the project check">When WonderBuild has a project ID, the editor checks the project before showing the workspace. While that happens, it can display <strong>Opening WonderBuild…</strong>.</Step>
                <Step number={3} title="Begin in Design mode">Design is the normal visual workspace. Code and Preview are available from the same top toolbar.</Step>
              </div>
            </section>

            <section id="layout" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><LayoutPanelTop className="h-7 w-7 text-violet-700" /><h2 className="text-3xl font-black tracking-tight">Editor layout</h2></div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The workspace is divided into the top toolbar, left tools, center canvas, and right inspector.</p>
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-3 shadow-2xl sm:p-4">
                <img src="/docs/wonderbuild-editor.svg" alt="WonderBuild editor showing top toolbar, left tools, center canvas, and right inspector" className="h-auto w-full rounded-2xl" />
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <ToolCard title="Top toolbar">Switch Design, Code, or Preview; change device size and zoom; toggle grid and snapping; undo or redo; open Assets; and publish.</ToolCard>
                <ToolCard title="Left tools">Open Pages, Insert, CMS, Assets, or Components.</ToolCard>
                <ToolCard title="Canvas">Select, move, resize, duplicate, delete, and arrange elements on the active page.</ToolCard>
                <ToolCard title="Right inspector">Edit the selected element through Content, Interactions, or AI.</ToolCard>
              </div>
            </section>

            <section id="toolbar" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Use the top toolbar</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <ToolCard title="Project + Autosave">The left side shows the project name and autosave status.</ToolCard>
                <ToolCard title="Design / Code">Design opens the visual builder. Code switches to the code workspace for the same project.</ToolCard>
                <ToolCard title="Desktop / Tablet / Mobile">Change the active breakpoint without leaving the editor.</ToolCard>
                <ToolCard title="Zoom / Grid / Snap">Change canvas zoom, toggle the visible grid, and enable snapping to the 8-pixel grid and alignment guides.</ToolCard>
                <ToolCard title="Undo / Redo">Reverse or restore recent changes from the toolbar or keyboard shortcuts.</ToolCard>
                <ToolCard title="Assets / Preview / Publish">Open Assets, switch to Preview mode, or open the Publish modal.</ToolCard>
              </div>
            </section>

            <section id="left-tools" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><LayoutPanelLeft className="h-7 w-7 text-blue-700" /><h2 className="text-3xl font-black tracking-tight">Use the left tools</h2></div>
              <div className="mt-7 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                <div className="p-5"><h3 className="font-bold">Pages</h3><p className="mt-2 text-sm leading-6 text-slate-600">Create, search, switch, and rename site pages. The Pages panel also contains the layer view for the active page. <Link href="/docs#pages" className="font-semibold text-blue-700 underline underline-offset-4">Read Pages docs</Link>.</p></div>
                <div className="p-5"><h3 className="font-bold">Insert</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open the block library and place available blocks on the current canvas.</p></div>
                <div className="p-5"><h3 className="font-bold">CMS</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open structured-content tools for data that should not live only inside one manually placed element.</p></div>
                <div className="p-5"><h3 className="font-bold">Assets</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open the project asset library. The Assets button in the top toolbar opens this same destination. <Link href="/docs#assets" className="font-semibold text-blue-700 underline underline-offset-4">Read Assets docs</Link>.</p></div>
                <div className="p-5"><h3 className="font-bold">Components</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open saved and reusable project components. <Link href="/docs#components" className="font-semibold text-blue-700 underline underline-offset-4">Read Components docs</Link>.</p></div>
              </div>
            </section>

            <section id="canvas" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Work on the canvas</h2>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Select an element">Click an element so it becomes the target for the inspector and selected-element actions.</Step>
                <Step number={2} title="Use quick actions">A selected element can expose quick actions for Design, AI, Duplicate, and Delete.</Step>
                <Step number={3} title="Move it">Drag the selected element. Containers can accept children, and WonderBuild prevents invalid parent-to-descendant drops.</Step>
                <Step number={4} title="Resize it">Use the resize handle. With Snap enabled, resizing follows the grid and alignment guides.</Step>
                <Step number={5} title="Deselect">Click empty canvas space or press Escape.</Step>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4 text-center"><PanelRight className="mx-auto h-5 w-5 text-violet-700"/><p className="mt-2 text-xs font-bold">Design</p></div>
                <div className="rounded-xl border border-slate-200 p-4 text-center"><Sparkles className="mx-auto h-5 w-5 text-violet-700"/><p className="mt-2 text-xs font-bold">AI</p></div>
                <div className="rounded-xl border border-slate-200 p-4 text-center"><Copy className="mx-auto h-5 w-5 text-blue-700"/><p className="mt-2 text-xs font-bold">Duplicate</p></div>
                <div className="rounded-xl border border-slate-200 p-4 text-center"><Trash2 className="mx-auto h-5 w-5 text-red-600"/><p className="mt-2 text-xs font-bold">Delete</p></div>
              </div>
            </section>

            <section id="inspector" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><PanelRight className="h-7 w-7 text-violet-700" /><h2 className="text-3xl font-black tracking-tight">Use the right inspector</h2></div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The right side edits the selected element. WonderBuild normalizes the inspector to three tabs: Content, Interactions, and AI.</p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <ToolCard title="Content">Edit the selected element’s content and design-facing properties.</ToolCard>
                <ToolCard title="Interactions">Configure behavior for the selected element.</ToolCard>
                <ToolCard title="AI">Send the selected element to the AI-assisted editing flow. <Link href="/docs#ai-editing" className="font-semibold text-violet-700 underline underline-offset-4">Read AI Editing docs</Link>.</ToolCard>
              </div>
            </section>

            <section id="responsive" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Responsive controls</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Use the device controls in the top toolbar to inspect the active page at desktop, tablet, and mobile breakpoints.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-5 text-center"><Monitor className="mx-auto h-7 w-7 text-violet-700"/><p className="mt-3 font-black">Desktop</p></div>
                <div className="rounded-2xl border border-slate-200 p-5 text-center"><Tablet className="mx-auto h-7 w-7 text-violet-700"/><p className="mt-3 font-black">Tablet</p></div>
                <div className="rounded-2xl border border-slate-200 p-5 text-center"><Smartphone className="mx-auto h-7 w-7 text-violet-700"/><p className="mt-3 font-black">Mobile</p></div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">For the complete breakpoint workflow, use the <Link href="/docs#responsive" className="font-semibold text-blue-700 underline underline-offset-4">Responsive Design documentation</Link>.</p>
            </section>

            <section id="modes" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Design, Code, and Preview</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <ToolCard title="Design">The normal visual builder with canvas and panels.</ToolCard>
                <ToolCard title="Code"><Code2 className="mb-2 h-5 w-5 text-violet-700" />Switch to the project code workspace.</ToolCard>
                <ToolCard title="Preview"><Eye className="mb-2 h-5 w-5 text-violet-700" />Switch the builder into live Preview mode before publishing. <Link href="/docs#preview" className="font-semibold text-violet-700 underline underline-offset-4">Read Preview docs</Link>.</ToolCard>
              </div>
            </section>

            <section id="saving" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><Save className="h-7 w-7 text-blue-700" /><h2 className="text-3xl font-black tracking-tight">Save, undo, and shortcuts</h2></div>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <ToolCard title="Save">Ctrl/Cmd + S saves locally when there is no project ID. With a project ID, WonderBuild saves the project and attempts to create a revision.</ToolCard>
                <ToolCard title="Undo / Redo">Ctrl/Cmd + Z runs Undo. Ctrl/Cmd + Y runs Redo.</ToolCard>
                <ToolCard title="Duplicate">Ctrl/Cmd + D duplicates the selected element.</ToolCard>
                <ToolCard title="Delete / Escape">Delete or Backspace removes the selected element. Escape clears the selection, or closes the shortcuts modal when it is open.</ToolCard>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 pt-16">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 sm:p-8">
                <CircleHelp className="h-7 w-7 text-amber-700" />
                <h2 className="mt-4 text-3xl font-black">Troubleshooting</h2>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><p className="font-bold">A page feature needs more detail</p><p className="mt-1 text-sm leading-6 text-slate-600">Use the WonderBuild sidebar links. Pages, Components, Content, Assets, AI, responsive, Preview, and Publish now open real documentation instead of dead labels.</p></div>
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><p className="font-bold">Publish says save first</p><p className="mt-1 text-sm leading-6 text-slate-600">Publishing the site requires a saved project ID. Save or reopen the project, then open Publish again.</p></div>
                </div>
              </div>
            </section>

            <div className="mt-16 grid gap-3 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <Link href="/docs/wonderbuild/start" className="rounded-2xl border border-slate-200 p-5 transition hover:border-violet-300 hover:bg-violet-50/40">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous</span>
                <p className="mt-2 font-bold">Start a WonderBuild project</p>
              </Link>
              <Link href="/docs#pages" className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-right transition hover:border-violet-400">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-500">Next</span>
                <p className="mt-2 font-bold text-violet-950">Manage Pages →</p>
              </Link>
            </div>
          </article>
        </main>

        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] border-l border-slate-200 bg-white px-5 py-8 xl:block">
          <p className="text-sm font-black text-slate-900">On this page</p>
          <nav className="mt-4 space-y-1 border-l border-slate-200 pl-4" aria-label="On this page">
            {toc.map(([label, href], index) => (
              <a key={label} href={href} className={`block py-1.5 text-sm transition hover:text-violet-700 ${index === 0 ? 'font-semibold text-violet-700' : 'text-slate-500'}`}>{label}</a>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-slate-200 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-slate-900">Docs links stay in Docs</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Only the explicit “Open WonderBuild” button leaves documentation and launches the product.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
