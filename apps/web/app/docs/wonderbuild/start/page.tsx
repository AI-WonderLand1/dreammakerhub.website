import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FilePlus2,
  FolderOpen,
  LayoutTemplate,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Start a WonderBuild Project | DreamMakerHub Docs',
  description: 'Start WonderBuild blank, from a template, with AI, or by reopening an existing project.',
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
  ['Choose how to start', '#choose'],
  ['Start blank', '#blank'],
  ['Start from a template', '#template'],
  ['Start with AI', '#ai'],
  ['Open an existing project', '#existing'],
  ['What happens next', '#next'],
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

export default function WonderBuildStartDocsPage() {
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
                className={`block rounded-lg px-3 py-2 ${index === 0 ? 'bg-violet-500/15 font-semibold text-violet-300' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}
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
              <span className="font-medium text-slate-700">Start</span>
            </div>

            <div className="mt-7 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">
                <Sparkles className="h-4 w-4" /> WonderBuild · Start
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Start your WonderBuild project</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">A new WonderBuild project starts one of three ways: blank, from a template, or with AI. All three paths end in the same visual editor. Existing projects skip the start choices and reopen the saved project instead.</p>
            </div>

            <section id="choose" className="scroll-mt-28 pt-12">
              <h2 className="text-3xl font-black tracking-tight">Choose how you want to start</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">The starting choice only controls the first version of the project. It does not create a different editor.</p>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <a href="#blank" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 transition hover:border-cyan-400 hover:shadow-md">
                  <FilePlus2 className="h-6 w-6 text-cyan-700" />
                  <h3 className="mt-3 font-black">Start Blank</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Create a clean project and enter the builder.</p>
                </a>
                <a href="#template" className="rounded-2xl border border-violet-200 bg-violet-50 p-5 transition hover:border-violet-400 hover:shadow-md">
                  <LayoutTemplate className="h-6 w-6 text-violet-700" />
                  <h3 className="mt-3 font-black">Browse Templates</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Use an existing design as the first version.</p>
                </a>
                <a href="#ai" className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5 transition hover:border-fuchsia-400 hover:shadow-md">
                  <WandSparkles className="h-6 w-6 text-fuchsia-700" />
                  <h3 className="mt-3 font-black">Generate with AI</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Let AI create the first design, then edit it normally.</p>
                </a>
              </div>
            </section>

            <section id="blank" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><FilePlus2 className="h-7 w-7 text-cyan-700" /><h2 className="text-3xl font-black tracking-tight">Start blank</h2></div>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Open WonderBuild">Use the explicit <strong>Open WonderBuild</strong> button when you are ready to leave Docs.</Step>
                <Step number={2} title="Name the project">The start flow uses <strong>Untitled Website</strong> as the fallback project name when no custom name is supplied.</Step>
                <Step number={3} title="Choose Start Blank">WonderBuild creates the project and opens the visual builder without a separate setup wizard.</Step>
                <Step number={4} title="Continue in the editor">Pages, Insert, CMS, Assets, Components, the right inspector, Preview, and Publish are available from the normal builder.</Step>
              </div>
            </section>

            <section id="template" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><LayoutTemplate className="h-7 w-7 text-violet-700" /><h2 className="text-3xl font-black tracking-tight">Start from a template</h2></div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Templates are starting designs. They do not create a second builder or a different project type.</p>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Choose Browse Templates">Open the template library from the WonderBuild start screen.</Step>
                <Step number={2} title="Pick a design">Choose the template you want as the first version of the project.</Step>
                <Step number={3} title="Create the project">WonderBuild creates a real saved project from that design.</Step>
                <Step number={4} title="Edit normally">The project opens in the same visual editor used by blank and AI starts.</Step>
              </div>
            </section>

            <section id="ai" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><WandSparkles className="h-7 w-7 text-fuchsia-700" /><h2 className="text-3xl font-black tracking-tight">Start with AI</h2></div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">AI Start generates the first design. After generation, the result becomes a normal WonderBuild project that you can keep editing.</p>
              <div className="mt-7 space-y-6">
                <Step number={1} title="Choose Generate with AI">Open the AI generation flow from the WonderBuild start screen.</Step>
                <Step number={2} title="Generate a starting design">Use the AI flow to create the initial website design.</Step>
                <Step number={3} title="Create the project from the result">WonderBuild uses the generated result as the project starting point.</Step>
                <Step number={4} title="Continue in the same editor">AI-generated projects use the same Pages, Components, Assets, Preview, and Publish workflow as every other WonderBuild project.</Step>
              </div>
            </section>

            <section id="existing" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3"><FolderOpen className="h-7 w-7 text-blue-700" /><h2 className="text-3xl font-black tracking-tight">Open an existing project</h2></div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Do not create another copy when the project already exists. Open it from My Projects and continue the saved project.</p>
              <Link href="/dashboard/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500">Open My Projects <ExternalLink className="h-4 w-4" /></Link>
            </section>

            <section id="next" className="scroll-mt-28 pt-16">
              <div className="rounded-3xl border border-violet-200 bg-violet-50 p-7 sm:p-8">
                <CheckCircle2 className="h-7 w-7 text-violet-700" />
                <h2 className="mt-4 text-3xl font-black">What happens next</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">Once a project exists, the next documentation page is Editor Basics. From there, the Docs sidebar points to real Pages, Components, Content, Assets, AI, responsive, Preview, and Publish documentation instead of dead labels.</p>
                <Link href="/docs/wonderbuild/editor" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-600">Read Editor Basics <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 pt-16">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 sm:p-8">
                <CircleHelp className="h-7 w-7 text-amber-700" />
                <h2 className="mt-4 text-3xl font-black">Troubleshooting</h2>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><p className="font-bold">I opened the wrong builder</p><p className="mt-1 text-sm leading-6 text-slate-600">Return to <Link href="/docs/getting-started/start-your-project" className="font-semibold text-blue-700 underline underline-offset-4">Start Your Project docs</Link> and choose the matching build path.</p></div>
                  <div className="rounded-xl border border-amber-200 bg-white/80 p-4"><p className="font-bold">I already have this project</p><p className="mt-1 text-sm leading-6 text-slate-600">Open the existing project instead of starting a second copy.</p></div>
                </div>
              </div>
            </section>

            <div className="mt-16 grid gap-3 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <Link href="/docs/getting-started/start-your-project" className="rounded-2xl border border-slate-200 p-5 transition hover:border-violet-300 hover:bg-violet-50/40">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous</span>
                <p className="mt-2 font-bold">Choose your project type</p>
              </Link>
              <Link href="/docs/wonderbuild/editor" className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-right transition hover:border-violet-400">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-500">Next</span>
                <p className="mt-2 font-bold text-violet-950">Learn the WonderBuild editor →</p>
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
        </aside>
      </div>
    </div>
  );
}
