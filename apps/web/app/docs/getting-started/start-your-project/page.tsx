import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Box,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Code2,
  ExternalLink,
  FolderOpen,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Start Your Project | DreamMakerHub Docs',
  description: 'Choose the DreamMakerHub product that matches what you want to build.',
};

const toc = [
  ['Choose what you are building', '#choose'],
  ['WonderBuild', '#wonderbuild'],
  ['WonderSpace', '#wonderspace'],
  ['WonderPlay', '#wonderplay'],
  ['NPC-AI-SIM', '#npc'],
  ['AI Playground', '#playground'],
  ['Open an existing project', '#existing'],
  ['If something goes wrong', '#troubleshooting'],
] as const;

const builders = [
  {
    id: 'wonderbuild',
    title: 'WonderBuild',
    subtitle: 'Websites and web apps',
    href: '/wonder-build',
    image: '/images/screenshots/puck-builder.svg',
    icon: Sparkles,
    description: 'Use WonderBuild when you want to create a website or web app with AI, templates, visual editing, code, preview, and publishing.',
    whatHappens: 'The WonderBuild start screen lets you begin blank, choose a template, or start with AI. All three paths feed into the same visual builder.',
    bullets: ['Start blank', 'Choose a template', 'Generate a starting design with AI'],
  },
  {
    id: 'wonderspace',
    title: 'WonderSpace',
    subtitle: 'Code projects and cloud development',
    href: '/wonderspace',
    image: '/images/screenshots/theia-builder.svg',
    icon: Code2,
    description: 'Use WonderSpace when you want a private cloud development workspace with files, terminal, Git, VS Code-style editing, and AI coding tools.',
    whatHappens: 'Opening WonderSpace takes you to its workspace launcher, where the cloud IDE environment is started for you.',
    bullets: ['Project files', 'Terminal and Git', 'AI-assisted coding'],
  },
  {
    id: 'wonderplay',
    title: 'WonderPlay',
    subtitle: '3D, games, panoramas, and video',
    href: '/dashboard/3dhub',
    image: '/images/screenshots/playcanvas-builder.svg',
    icon: Gamepad2,
    description: 'Use WonderPlay for 3D work. The current 3DHub Studio includes 3D Factory, 360 View, Game Builder, and Movie Maker.',
    whatHappens: 'The studio opens with 3D Factory and lets you switch between AI mesh generation, panorama environments, game building, and cinematic timeline tools.',
    bullets: ['3D Factory', '360 View', 'Game Builder', 'Movie Maker'],
  },
] as const;

export default function StartYourProjectDocsPage() {
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
            <Link href="/support" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Help</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_230px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-r border-slate-800 px-4 py-7 lg:block">
          <p className="px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Getting Started</p>
          <nav className="mt-3 space-y-1 text-sm">
            <Link href="/docs/getting-started/sign-up" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">1. Sign Up</Link>
            <Link href="/docs/getting-started/sign-in" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">2. Sign In</Link>
            <Link href="/docs/getting-started/start-your-project" className="block rounded-lg bg-blue-600/15 px-3 py-2 font-semibold text-blue-300">3. Start Your Project</Link>
          </nav>

          <p className="mt-8 px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Build Your Project</p>
          <nav className="mt-3 space-y-1 text-sm text-slate-400">
            <a href="#wonderbuild" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderBuild</a>
            <a href="#wonderspace" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderSpace</a>
            <a href="#wonderplay" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderPlay</a>
            <a href="#npc" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">NPC-AI-SIM</a>
          </nav>
        </aside>

        <main className="min-w-0 bg-white text-slate-950">
          <article className="mx-auto max-w-5xl px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/docs" className="hover:text-blue-600">Docs</Link>
              <ChevronRight className="h-4 w-4" />
              <span>Getting Started</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-slate-700">Start Your Project</span>
            </div>

            <div className="mt-7 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                <Box className="h-4 w-4" /> Step 3
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Choose what you want to build</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">DreamMakerHub has separate builders for different kinds of work. Pick the product that matches the thing you are making, then follow that product's build documentation.</p>
            </div>

            <section id="choose" className="scroll-mt-28 pt-12">
              <h2 className="text-3xl font-black tracking-tight">Choose your build path</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">You do not need to learn every tool before starting. Pick one path now. You can return to Projects later and work on a different kind of project.</p>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <Link href="#wonderbuild" className="rounded-2xl border border-violet-200 bg-violet-50 p-5 transition hover:border-violet-400 hover:shadow-md">
                  <Sparkles className="h-6 w-6 text-violet-700" />
                  <h3 className="mt-3 text-lg font-black">Website or web app</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose WonderBuild.</p>
                </Link>
                <Link href="#wonderspace" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 transition hover:border-blue-400 hover:shadow-md">
                  <Code2 className="h-6 w-6 text-blue-700" />
                  <h3 className="mt-3 text-lg font-black">Code project</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose WonderSpace.</p>
                </Link>
                <Link href="#wonderplay" className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 transition hover:border-cyan-400 hover:shadow-md">
                  <Gamepad2 className="h-6 w-6 text-cyan-700" />
                  <h3 className="mt-3 text-lg font-black">3D, game, panorama, or movie</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose WonderPlay.</p>
                </Link>
                <Link href="#npc" className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5 transition hover:border-fuchsia-400 hover:shadow-md">
                  <Bot className="h-6 w-6 text-fuchsia-700" />
                  <h3 className="mt-3 text-lg font-black">Intelligent 3D character</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose NPC-AI-SIM.</p>
                </Link>
              </div>
            </section>

            {builders.map((builder) => {
              const Icon = builder.icon;
              return (
                <section key={builder.id} id={builder.id} className="scroll-mt-28 pt-16">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
                    <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="flex flex-col justify-center p-7 text-white sm:p-8">
                        <Icon className="h-7 w-7 text-blue-400" />
                        <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-blue-400">{builder.subtitle}</p>
                        <h2 className="mt-2 text-3xl font-black">{builder.title}</h2>
                        <p className="mt-4 leading-7 text-slate-300">{builder.description}</p>
                        <ul className="mt-5 space-y-2 text-sm text-slate-300">
                          {builder.bullets.map((item) => (
                            <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {item}</li>
                          ))}
                        </ul>
                        <Link href={builder.href} className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500">
                          Open {builder.title} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="min-h-[280px] bg-slate-900 p-5">
                        <img src={builder.image} alt={`${builder.title} product preview`} className="h-full w-full rounded-2xl object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-bold">What happens when you choose {builder.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{builder.whatHappens}</p>
                  </div>
                </section>
              );
            })}

            <section id="npc" className="scroll-mt-28 pt-16">
              <div className="rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-7 sm:p-8">
                <Bot className="h-8 w-8 text-fuchsia-700" />
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-fuchsia-700">Intelligent characters</p>
                <h2 className="mt-2 text-3xl font-black">NPC-AI-SIM</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">Use NPC-AI-SIM when the thing you are building is an intelligent 3D character. The current product navigation describes it as the place to create, configure, test, and export intelligent characters.</p>
                <div className="mt-5 rounded-2xl border border-fuchsia-200 bg-white/70 p-5">
                  <p className="font-bold">What happens when you open it</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">DreamMakerHub's <strong>/wonder-play</strong> route hands you off to the separate NPC-AI-SIM app. That is expected behavior, not a broken redirect.</p>
                </div>
                <Link href="/wonder-play" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold text-white hover:bg-fuchsia-600">
                  Open NPC-AI-SIM <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section id="playground" className="scroll-mt-28 pt-16">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 sm:p-8">
                <Sparkles className="h-7 w-7 text-amber-700" />
                <h2 className="mt-4 text-3xl font-black">AI Playground is a testing workspace</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">AI Playground is available at its own DreamMakerHub subdomain for testing prompts, providers, models, and agent workflows. It is useful while building, but it is not the main saved-project destination for a website, code workspace, 3D project, or NPC.</p>
                <a href="https://playground.dreammakerhub.website/" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-bold text-amber-900 hover:border-amber-500">
                  Open AI Playground <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </section>

            <section id="existing" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-7 w-7 text-blue-700" />
                <h2 className="text-3xl font-black tracking-tight">Open an existing project</h2>
              </div>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Use Projects when you already started something and want to continue it. The Projects dashboard lists your saved projects and gives you actions for opening the editor, files, published pages, and deleting a project.</p>
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="font-bold">Creating from the Projects dashboard</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">The current <strong>New Project</strong> dialog directly offers WonderBuild and WonderPlay. WonderSpace, NPC-AI-SIM, and AI Playground are opened from their own product entry points instead.</p>
              </div>
              <Link href="/dashboard/projects" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500">
                Open My Projects <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 pt-16">
              <div className="flex items-center gap-3">
                <CircleHelp className="h-7 w-7 text-amber-600" />
                <h2 className="text-3xl font-black tracking-tight">If something goes wrong</h2>
              </div>
              <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                <div className="p-5">
                  <h3 className="font-bold">I opened the wrong builder</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Return to this page or your Projects dashboard and choose the product that matches the thing you want to make. You do not need to force a website into WonderSpace or a 3D project into WonderBuild.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">WonderBuild asks me to sign in</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Creating a blank WonderBuild project requires an authenticated account. Sign in, then return to WonderBuild and start again.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">NPC-AI-SIM opens another DreamMakerHub address</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">That is expected. The current route redirects to the separate NPC-AI-SIM application.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">I do not see WonderSpace in New Project</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">The current Projects dialog only creates WonderBuild and WonderPlay entries. Open WonderSpace directly from its product link.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">My project already exists</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Do not create another copy unless you actually want one. Open Projects and continue the existing project.</p>
                </div>
              </div>

              <Link href="/support" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold hover:border-blue-400 hover:text-blue-700">
                Open Support Center <ExternalLink className="h-4 w-4" />
              </Link>
            </section>

            <section className="pt-14">
              <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-8">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                <h2 className="mt-4 text-2xl font-black">You chose your build path</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">The next documentation level is Build Your Project. Each product will get its own detailed pages for the actual controls, workflow, images, and troubleshooting instead of dumping everything into one giant article.</p>
              </div>
            </section>

            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-7 text-sm">
              <Link href="/docs/getting-started/sign-in" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Sign In</Link>
              <Link href="#wonderbuild" className="inline-flex items-center gap-2 font-semibold text-blue-700">Choose a builder <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </article>
        </main>

        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-l border-slate-200 bg-white px-5 py-8 text-slate-950 xl:block">
          <p className="text-sm font-black">On this page</p>
          <nav className="mt-4 space-y-3 border-l border-slate-200 pl-4 text-sm">
            {toc.map(([label, href]) => (
              <a key={href} href={href} className="block text-slate-500 hover:text-blue-700">{label}</a>
            ))}
          </nav>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-black">Need help?</p>
            <Link href="/support" className="mt-3 flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700"><CircleHelp className="h-4 w-4" /> Support Center</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
