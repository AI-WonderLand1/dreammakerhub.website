import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FilePlus2,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  PlayCircle,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Start a WonderBuild Project | DreamMakerHub Docs',
  description: 'Start WonderBuild blank, from a template, with AI, or by reopening an existing project.',
};

const toc = [
  ['Choose how to start', '#choose'],
  ['Start blank', '#blank'],
  ['Start from a template', '#template'],
  ['Start with AI', '#ai'],
  ['Open an existing project', '#existing'],
  ['What happens next', '#next'],
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

function ProductPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-3 shadow-2xl sm:p-4">
      <img src={src} alt={alt} className="h-auto w-full rounded-2xl border border-white/10 object-cover" />
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
            <Link href="/docs/wonderbuild/start" className="block rounded-lg bg-violet-500/15 px-3 py-2 font-semibold text-violet-300">Start</Link>
            <Link href="/docs/wonderbuild/editor" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">Editor Basics</Link>
          </nav>

          <p className="mt-8 px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Other Build Paths</p>
          <nav className="mt-3 space-y-1 text-sm text-slate-400">
            <Link href="/wonderspace" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderSpace</Link>
            <Link href="/dashboard/3dhub" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderPlay</Link>
            <Link href="/wonder-play" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">NPC-AI-SIM</Link>
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
              <p className="mt-4 text-lg leading-8 text-slate-600">WonderBuild gives you three ways to begin a new website or web app: start blank, choose a template, or let AI create the first version. Existing projects can be reopened without starting over.</p>
            </div>

            <section id="choose" className="scroll-mt-28 pt-12">
              <h2 className="text-3xl font-black tracking-tight">Choose how you want to start</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">All three new-project choices lead to the same WonderBuild visual editor. You are only choosing the starting point, not locking the project into a different editor.</p>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <a href="#blank" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 transition hover:border-cyan-400 hover:shadow-md">
                  <FilePlus2 className="h-6 w-6 text-cyan-700" />
                  <h3 className="mt-3 font-black">Start Blank</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Create a clean WonderBuild project and enter the editor immediately.</p>
                </a>
                <a href="#template" className="rounded-2xl border border-violet-200 bg-violet-50 p-5 transition hover:border-violet-400 hover:shadow-md">
                  <LayoutTemplate className="h-6 w-6 text-violet-700" />
                  <h3 className="mt-3 font-black">Browse Templates</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Pick a designed starting point and continue editing it in WonderBuild.</p>
                </a>
                <a href="#ai" className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5 transition hover:border-fuchsia-400 hover:shadow-md">
                  <WandSparkles className="h-6 w-6 text-fuchsia-700" />
                  <h3 className="mt-3 font-black">Generate with AI</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Have AI create a starting design, then keep editing it normally.</p>
                </a>
              </div>

              <div className="mt-8">
                <ProductPreview src="/docs/wonderbuild-editor.svg" alt="WonderBuild visual builder preview" />
              </div>
            </section>

            <section id="blank" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <FilePlus2 className="h-7 w-7 text-cyan-700" />
                <h2 className="text-3xl font-black tracking-tight">Start blank</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Use this when you want a clean project with no template content. The current WonderBuild start screen begins with the project name <strong>Untitled Website</strong>, which you can replace before creating the project.</p>

              <div className="mt-7 space-y-6">
                <Step number={1} title="Open WonderBuild">
                  Go to <Link href="/wonder-build" className="font-semibold text-violet-700 underline underline-offset-4">WonderBuild</Link>. The Start screen shows the Blank, Template, and AI choices.
                </Step>
                <Step number={2} title="Name the project">
                  Replace <strong>Untitled Website</strong> with the name you want. If the field is empty when you start, WonderBuild falls back to <strong>Untitled Website</strong> automatically.
                </Step>
                <Step number={3} title="Select Start Blank">
                  WonderBuild creates the project and opens the visual builder. There is no separate setup wizard between Start and Build.
                </Step>
                <Step number={4} title="Begin editing">
                  Once the builder opens, the project is ready for pages, components, content, AI changes, preview, and publishing. Those controls are covered in the next WonderBuild documentation pages.
                </Step>
              </div>
            </section>

            <section id="template" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <LayoutTemplate className="h-7 w-7 text-violet-700" />
                <h2 className="text-3xl font-black tracking-tight">Start from a template</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Templates are starting designs, not separate project types. Choosing one creates a normal WonderBuild project, places the selected design into it, and opens that project in the same visual editor.</p>

              <div className="mt-7 space-y-6">
                <Step number={1} title="Select Browse Templates">
                  From the WonderBuild Start screen, choose <strong>Browse Templates</strong>. This opens the WonderBuild template library.
                </Step>
                <Step number={2} title="Browse the available starting designs">
                  Use the template library to look through the available categories and designs. The old extra industry-choice modal has been disabled, so you are not forced through another setup step before browsing.
                </Step>
                <Step number={3} title="Choose the design you want to use">
                  Selecting a template for editing creates a real WonderBuild project from that design.
                </Step>
                <Step number={4} title="Continue in the visual builder">
                  After the template is placed into the project, WonderBuild opens the normal builder with that project loaded. From this point forward, it behaves like any other WonderBuild project.
                </Step>
              </div>

              <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <div className="flex gap-3">
                  <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                  <div>
                    <p className="font-bold">Templates do not create a second builder.</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">The selected design is only the first version of your project. Editing, AI changes, preview, and publishing all continue in WonderBuild.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="ai" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <WandSparkles className="h-7 w-7 text-fuchsia-700" />
                <h2 className="text-3xl font-black tracking-tight">Start with AI</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Use AI Start when you want DreamMakerHub to generate the first design for you. It still becomes a normal WonderBuild project after generation.</p>

              <div className="mt-7 space-y-6">
                <Step number={1} title="Select Generate with AI">
                  On the WonderBuild Start screen, choose <strong>Generate with AI</strong>. This opens the template library directly in its AI generation flow.
                </Step>
                <Step number={2} title="Run the AI generation">
                  The current AI flow generates a batch of website starting designs for the selected category. While generation is running, the button shows a loading state.
                </Step>
                <Step number={3} title="Wait for a generated design">
                  When generation succeeds, WonderBuild adds the generated designs to the active template collection and uses the first generated result as the project starting point.
                </Step>
                <Step number={4} title="Continue in WonderBuild">
                  WonderBuild creates the project from the generated design and opens it in the same visual builder used by Blank and Template starts.
                </Step>
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-7">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-7 w-7 text-fuchsia-400" />
                  <div>
                    <p className="font-black">Want a visual walkthrough?</p>
                    <p className="mt-1 text-sm text-slate-400">The Tutorials area is where video-style walkthroughs belong as they are added.</p>
                  </div>
                </div>
                <Link href="/tutorials" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100">
                  Open Tutorials <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section id="existing" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-7 w-7 text-blue-700" />
                <h2 className="text-3xl font-black tracking-tight">Open an existing WonderBuild project</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">If the project already exists, do not make another copy. Open <Link href="/dashboard/projects" className="font-semibold text-blue-700 underline underline-offset-4">My Projects</Link> and continue the saved project.</p>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="font-bold">Existing-project links skip the Start choices.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">When WonderBuild receives an existing project ID, the Start page routes that project directly into the visual builder instead of asking you to choose Blank, Template, or AI again.</p>
              </div>
            </section>

            <section id="next" className="scroll-mt-28 pt-16">
              <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-8">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                <h2 className="mt-4 text-2xl font-black">What happens next</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">Once the project opens, you are in the Build part of WonderBuild. Continue with Editor Basics to learn the toolbar, panels, canvas, inspector, responsive controls, saving, and the normal editing workflow.</p>
                <Link href="/docs/wonderbuild/editor" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold hover:bg-violet-500">Continue to Editor Basics <ArrowRight className="h-4 w-4" /></Link>
              </div>

              <div className="mt-8">
                <ProductPreview src="/docs/wonderbuild-editor.svg" alt="WonderBuild editor documentation preview" />
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <CircleHelp className="h-7 w-7 text-amber-600" />
                <h2 className="text-3xl font-black tracking-tight">If something goes wrong</h2>
              </div>

              <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                <div className="p-5">
                  <h3 className="font-bold">WonderBuild sends me to Sign In</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Project creation requires a signed-in account. Sign in, return to WonderBuild, and choose your start method again. The current project-creation API checks authentication, not a paid subscription tier.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">I see “Unable to create website project”</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">The blank-project request did not complete. Check that you are still signed in, then retry once. If it continues, open Support rather than repeatedly creating more attempts.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">A template failed to open in the builder</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Template start first creates a project and then places the template into it. If that second step fails, check My Projects before trying again because the project itself may already exist.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">AI says “Generation Failed”</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">The AI modal displays the generation error when the request fails. Close or retry the generation once. If the problem continues, use a normal template or blank start and report the AI failure through Support.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">AI finishes but no design appears</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">The current AI flow treats an empty generated-template list as an error. Retry the generation or use another start method instead of waiting indefinitely.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">I left the project name empty</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Blank start automatically uses <strong>Untitled Website</strong>. You do not need to abandon the project just because the name field was empty.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">An existing project gets stuck on “Opening website project…”</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Open My Projects and launch the project from there. If the builder still does not open, use Support and include the project name so the problem can be traced without creating another copy.</p>
                </div>
              </div>

              <Link href="/support" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold hover:border-blue-400 hover:text-blue-700">
                Open Support Center <ExternalLink className="h-4 w-4" />
              </Link>
            </section>

            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-7 text-sm">
              <Link href="/docs/getting-started/start-your-project" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" /> Start Your Project</Link>
              <Link href="/docs/wonderbuild/editor" className="inline-flex items-center gap-2 font-semibold text-violet-700">Editor Basics <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </article>
        </main>

        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-l border-slate-200 bg-white px-5 py-8 text-slate-950 xl:block">
          <p className="text-sm font-black">On this page</p>
          <nav className="mt-4 space-y-3 border-l border-slate-200 pl-4 text-sm">
            {toc.map(([label, href]) => (
              <a key={href} href={href} className="block text-slate-500 hover:text-violet-700">{label}</a>
            ))}
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
