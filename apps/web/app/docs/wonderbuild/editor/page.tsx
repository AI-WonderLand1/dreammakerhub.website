import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
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
  description: 'Learn the WonderBuild editor layout, canvas, panels, responsive controls, saving, and basic editing workflow.',
};

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
  ['If something goes wrong', '#troubleshooting'],
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
            <Link href="/dashboard/projects" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 sm:inline-flex">My Projects</Link>
            <Link href="/wonder-build" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500">Open WonderBuild</Link>
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
            <Link href="/docs/wonderbuild/start" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">Start</Link>
            <Link href="/docs/wonderbuild/editor" className="block rounded-lg bg-violet-500/15 px-3 py-2 font-semibold text-violet-300">Editor Basics</Link>
            <span className="block px-3 py-2 text-slate-600">Pages</span>
            <span className="block px-3 py-2 text-slate-600">Components</span>
            <span className="block px-3 py-2 text-slate-600">Assets</span>
            <span className="block px-3 py-2 text-slate-600">AI Editing</span>
            <span className="block px-3 py-2 text-slate-600">Preview</span>
            <span className="block px-3 py-2 text-slate-600">Publish</span>
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
              <p className="mt-4 text-lg leading-8 text-slate-600">This is the main workspace where you edit a WonderBuild project. You can work visually on the canvas, switch to code, preview the result, use AI on selected elements, and publish from the same editor.</p>
            </div>

            <section id="open" className="scroll-mt-28 pt-12">
              <h2 className="text-3xl font-black tracking-tight">Open the editor</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">A new WonderBuild project normally opens the editor automatically. For an existing project, open it from My Projects rather than starting another copy.</p>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Open your WonderBuild project">
                  Create one from <Link href="/docs/wonderbuild/start" className="font-semibold text-violet-700 underline underline-offset-4">WonderBuild Start</Link> or open an existing WonderBuild project from <Link href="/dashboard/projects" className="font-semibold text-blue-700 underline underline-offset-4">My Projects</Link>.
                </Step>
                <Step number={2} title="Wait for the project to open">
                  While the project is being checked, the editor displays <strong>Opening WonderBuild…</strong>. When the project is ready, the Design workspace appears.
                </Step>
                <Step number={3} title="Start in Design mode">
                  Design is the normal visual-editing mode. Code and Preview are available from the top toolbar when you need them.
                </Step>
              </div>
            </section>

            <section id="layout" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <LayoutPanelTop className="h-7 w-7 text-violet-700" />
                <h2 className="text-3xl font-black tracking-tight">Editor layout</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The visual editor is split into four practical areas: the top toolbar, left tools, the center canvas, and the right inspector.</p>
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-3 shadow-2xl sm:p-4">
                <img src="/docs/wonderbuild-editor.svg" alt="WonderBuild editor showing the top toolbar, left tools, center canvas, and right inspector" className="h-auto w-full rounded-2xl" />
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <ToolCard title="Top toolbar">Switch modes, change device size and zoom, toggle panels, undo or redo, open Assets, Preview, and Publish.</ToolCard>
                <ToolCard title="Left tools">Open Pages, Insert, CMS, Assets, or Components.</ToolCard>
                <ToolCard title="Canvas">Select, move, resize, duplicate, delete, and visually arrange the elements in the active page.</ToolCard>
                <ToolCard title="Right inspector">Edit the selected element through Content, Interactions, or AI.</ToolCard>
              </div>
            </section>

            <section id="toolbar" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Use the top toolbar</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The toolbar stays at the top of the editor and is the fastest way to move between the major parts of the build workflow.</p>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <ToolCard title="Project name + Autosave">The left side shows the current project name and an Autosave status indicator.</ToolCard>
                <ToolCard title="Design / Code"><strong>Design</strong> shows the visual editor. <strong>Code</strong> opens the code workspace for the project.</ToolCard>
                <ToolCard title="Desktop / Tablet / Mobile">Change the canvas breakpoint without leaving the editor so you can inspect the project at different device widths.</ToolCard>
                <ToolCard title="Zoom, Grid, Snap">Change canvas zoom, show or hide the grid, and enable snapping while resizing or aligning elements.</ToolCard>
                <ToolCard title="Undo / Redo">Reverse or restore recent editor changes. The buttons are also available as keyboard shortcuts.</ToolCard>
                <ToolCard title="Assets / Preview / Publish">Open the asset panel directly, inspect the project in Preview mode, or open the Publish flow.</ToolCard>
              </div>
            </section>

            <section id="left-tools" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <LayoutPanelLeft className="h-7 w-7 text-blue-700" />
                <h2 className="text-3xl font-black tracking-tight">Use the left tools</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The left side controls what you can add to or manage in the current project. The panel can be hidden from the toolbar when you need more canvas space.</p>
              <div className="mt-7 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                <div className="p-5"><h3 className="font-bold">Pages</h3><p className="mt-2 text-sm leading-6 text-slate-600">Manage the pages in the current WonderBuild project and switch the active page. The full Pages workflow gets its own documentation section next.</p></div>
                <div className="p-5"><h3 className="font-bold">Insert</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open the component library and drag available blocks onto the canvas.</p></div>
                <div className="p-5"><h3 className="font-bold">CMS</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open the current CMS tools for content that is managed as structured data rather than placed manually on one page.</p></div>
                <div className="p-5"><h3 className="font-bold">Assets</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open the project asset library. The Assets button in the top toolbar opens this same left-panel destination.</p></div>
                <div className="p-5"><h3 className="font-bold">Components</h3><p className="mt-2 text-sm leading-6 text-slate-600">Open saved or reusable components for the project.</p></div>
              </div>
            </section>

            <section id="canvas" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Work on the canvas</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The canvas is the visual page you are editing. Most day-to-day WonderBuild work starts by selecting something on the canvas and then changing it.</p>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Select an element">
                  Click an element on the canvas. A selected element receives a visible selection outline and becomes the target for the inspector and AI tools.
                </Step>
                <Step number={2} title="Use the quick actions">
                  A selected element shows quick actions above it for opening the design inspector, editing that selection with AI, duplicating it, or deleting it.
                </Step>
                <Step number={3} title="Move an element">
                  Drag an existing element to reposition it. Containers can accept child elements, and WonderBuild prevents a parent from being dropped into one of its own descendants.
                </Step>
                <Step number={4} title="Resize an element">
                  Drag the resize handle at the lower-right of a selected element. When Snap is enabled, resizing follows the 8-pixel grid and can show alignment guides.
                </Step>
                <Step number={5} title="Deselect when you are finished">
                  Click empty canvas space or press Escape. This clears the current selection.
                </Step>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4 text-center"><PanelRight className="mx-auto h-5 w-5 text-violet-700"/><p className="mt-2 text-xs font-bold">Design</p></div>
                <div className="rounded-xl border border-slate-200 p-4 text-center"><Sparkles className="mx-auto h-5 w-5 text-violet-700"/><p className="mt-2 text-xs font-bold">AI</p></div>
                <div className="rounded-xl border border-slate-200 p-4 text-center"><Copy className="mx-auto h-5 w-5 text-blue-700"/><p className="mt-2 text-xs font-bold">Duplicate</p></div>
                <div className="rounded-xl border border-slate-200 p-4 text-center"><Trash2 className="mx-auto h-5 w-5 text-red-600"/><p className="mt-2 text-xs font-bold">Delete</p></div>
              </div>
            </section>

            <section id="inspector" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <PanelRight className="h-7 w-7 text-violet-700" />
                <h2 className="text-3xl font-black tracking-tight">Use the right inspector</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The right side edits the currently selected element. If nothing is selected, the panel tells you to select an element on the canvas first.</p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <ToolCard title="Content">Edit the selected element’s available content, layout, styles, responsive properties, and element-specific settings. Images expose additional image controls and filters.</ToolCard>
                <ToolCard title="Interactions">Open interaction settings for the selected element. Detailed interaction workflows will be documented separately rather than squeezed into this basics page.</ToolCard>
                <ToolCard title="AI">Send the selected element into the AI assistant so changes can be made with that element as the editing context.</ToolCard>
              </div>
              <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <p className="font-bold">The inspector follows your selection.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">If the right panel looks empty or says to select an element, click the text, image, section, button, or other element you actually want to edit on the canvas.</p>
              </div>
            </section>

            <section id="responsive" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Check responsive layouts while you build</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The toolbar gives you Desktop, Tablet, and Mobile canvas buttons. The inspector also has responsive breakpoint controls for the selected element.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-5"><Monitor className="h-6 w-6 text-blue-700"/><h3 className="mt-3 font-bold">Desktop</h3><p className="mt-2 text-sm leading-6 text-slate-600">Use the widest normal editing view for desktop layouts.</p></div>
                <div className="rounded-2xl border border-slate-200 p-5"><Tablet className="h-6 w-6 text-violet-700"/><h3 className="mt-3 font-bold">Tablet</h3><p className="mt-2 text-sm leading-6 text-slate-600">Check how sections and spacing behave at tablet width.</p></div>
                <div className="rounded-2xl border border-slate-200 p-5"><Smartphone className="h-6 w-6 text-fuchsia-700"/><h3 className="mt-3 font-bold">Mobile</h3><p className="mt-2 text-sm leading-6 text-slate-600">Inspect the narrow mobile canvas before publishing.</p></div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">The canvas itself uses approximately 1180px for Desktop, 768px for Tablet, and 375px for Mobile. A wider breakpoint also exists in the inspector for element styling.</p>
            </section>

            <section id="modes" className="scroll-mt-28 pt-16">
              <h2 className="text-3xl font-black tracking-tight">Design, Code, and Preview are views of the same project</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><MousePointer2 className="h-6 w-6 text-violet-700"/><h3 className="mt-3 font-black">Design</h3><p className="mt-2 text-sm leading-6 text-slate-600">The drag-and-drop visual editor with the left tools, canvas, and inspector.</p></div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><Code2 className="h-6 w-6 text-blue-700"/><h3 className="mt-3 font-black">Code</h3><p className="mt-2 text-sm leading-6 text-slate-600">Switches the main workspace to WonderBuild’s code environment. You do not need to use Code mode for normal visual editing.</p></div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5"><Eye className="h-6 w-6 text-cyan-700"/><h3 className="mt-3 font-black">Preview</h3><p className="mt-2 text-sm leading-6 text-slate-600">Shows the project preview inside the builder so you can inspect the result without leaving the workflow.</p></div>
              </div>
            </section>

            <section id="saving" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <Save className="h-7 w-7 text-emerald-700" />
                <h2 className="text-3xl font-black tracking-tight">Save, undo, redo, and useful shortcuts</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The toolbar displays Autosave, and you can also save explicitly from the keyboard. The editor has direct shortcuts for the most common actions.</p>
              <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Undo</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Ctrl/Cmd + Z</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Redo</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Ctrl/Cmd + Y</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Save project</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Ctrl/Cmd + S</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Duplicate selected element</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Ctrl/Cmd + D</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Delete selected element</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Delete / Backspace</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Deselect / close shortcuts</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Escape</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Zoom in / out</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Ctrl/Cmd + +/-</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 p-4 text-sm"><span className="font-semibold">Reset zoom</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">Ctrl/Cmd + 0</kbd></div>
                <div className="grid grid-cols-[1fr_auto] gap-4 p-4 text-sm"><span className="font-semibold">Open keyboard shortcut panel</span><kbd className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">?</kbd></div>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <CircleHelp className="h-7 w-7 text-amber-600" />
                <h2 className="text-3xl font-black tracking-tight">If something goes wrong</h2>
              </div>
              <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                <div className="p-5"><h3 className="font-bold">I see “Project not found”</h3><p className="mt-2 text-sm leading-6 text-slate-600">The editor could not find that project or your account does not have access to it. Use the <strong>Back to Projects</strong> button and open the project from My Projects instead of editing the URL manually.</p></div>
                <div className="p-5"><h3 className="font-bold">The left tools disappeared</h3><p className="mt-2 text-sm leading-6 text-slate-600">Use the left-panel button in the top toolbar to show the tools again.</p></div>
                <div className="p-5"><h3 className="font-bold">The inspector is empty</h3><p className="mt-2 text-sm leading-6 text-slate-600">Select an element on the canvas. The right inspector only has element-specific controls when something is selected.</p></div>
                <div className="p-5"><h3 className="font-bold">I cannot see the visual canvas</h3><p className="mt-2 text-sm leading-6 text-slate-600">Check the top toolbar. If Code or Preview is active, switch back to <strong>Design</strong>.</p></div>
                <div className="p-5"><h3 className="font-bold">Everything looks too large or too small</h3><p className="mt-2 text-sm leading-6 text-slate-600">Use the zoom selector in the toolbar or press Ctrl/Cmd + 0 to return to 100% zoom.</p></div>
                <div className="p-5"><h3 className="font-bold">I resized something and it keeps snapping</h3><p className="mt-2 text-sm leading-6 text-slate-600">Snap is enabled. Turn off <strong>Snap</strong> in the top toolbar when you want free resizing instead of the 8-pixel grid and alignment guides.</p></div>
                <div className="p-5"><h3 className="font-bold">I deleted or changed the wrong thing</h3><p className="mt-2 text-sm leading-6 text-slate-600">Use Undo in the toolbar or Ctrl/Cmd + Z before continuing.</p></div>
              </div>
              <Link href="/support" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold hover:border-violet-400 hover:text-violet-700">
                Open Support Center <ExternalLink className="h-4 w-4" />
              </Link>
            </section>

            <section className="pt-14">
              <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-8">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                <h2 className="mt-4 text-2xl font-black">Next: Pages</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">Once the editor layout makes sense, the next WonderBuild section will cover the Pages panel in detail: creating pages, switching pages, renaming them, homepage behavior, deleting pages, and what to do when page content does not look right.</p>
              </div>
            </section>

            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-7 text-sm">
              <Link href="/docs/wonderbuild/start" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" /> WonderBuild Start</Link>
              <span className="inline-flex items-center gap-2 font-semibold text-slate-400">Pages <ArrowRight className="h-4 w-4" /></span>
            </div>
          </article>
        </main>

        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-l border-slate-200 bg-white px-5 py-8 text-slate-950 xl:block">
          <p className="text-sm font-black">On this page</p>
          <nav className="mt-4 space-y-3 border-l border-slate-200 pl-4 text-sm">
            {toc.map(([label, href]) => <a key={href} href={href} className="block text-slate-500 hover:text-violet-700">{label}</a>)}
          </nav>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-black">Need help?</p>
            <Link href="/support" className="mt-3 flex items-center gap-2 text-sm text-slate-600 hover:text-violet-700"><CircleHelp className="h-4 w-4" /> Support Center</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
