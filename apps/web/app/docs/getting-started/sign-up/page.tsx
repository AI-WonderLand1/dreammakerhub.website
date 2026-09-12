import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Github,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up | DreamMakerHub Docs',
  description: 'Create a DreamMakerHub account and confirm your email.',
};

const toc = [
  ['Before you start', '#before-you-start'],
  ['Create your account', '#create-account'],
  ['Confirm your email', '#confirm-email'],
  ['Use GitHub or Google', '#oauth'],
  ['If something goes wrong', '#troubleshooting'],
  ['What happens next', '#next'],
] as const;

function AuthPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-black p-5 shadow-2xl sm:p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 inline-flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-sm font-black text-white">AI</div>
          <span className="text-xl font-bold text-white">AI Wonderland</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left">
          <div className="text-center">
            <p className="text-xl font-bold text-white">Welcome</p>
            <p className="mt-1 text-sm text-slate-400">Sign in to continue building</p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-500">Email</div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-500">Password</div>
            <div className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-center text-sm font-bold text-white">Sign In</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-center text-sm text-white">GitHub</div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-center text-sm text-white">Google</div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">No account? <span className="font-semibold text-pink-400">Sign Up</span></p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">{number}</span>
      <div>
        <h3 className="font-bold text-slate-950">{title}</h3>
        <div className="mt-1 text-sm leading-6 text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export default function SignUpDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link href="/docs" className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600">D</span>
            <span>DreamMakerHub <span className="font-medium text-slate-400">Docs</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/support" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 sm:inline-flex">Help</Link>
            <Link href="/public-pages/auth" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Sign In</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_230px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] overflow-y-auto border-r border-slate-800 px-4 py-7 lg:block">
          <p className="px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Getting Started</p>
          <nav className="mt-3 space-y-1 text-sm">
            <Link href="/docs/getting-started/sign-up" className="block rounded-lg bg-blue-600/15 px-3 py-2 font-semibold text-blue-300">1. Sign Up</Link>
            <Link href="/docs#sign-in" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">2. Sign In</Link>
            <Link href="/docs#start-project" className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">3. Start Your Project</Link>
          </nav>

          <p className="mt-8 px-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Build Your Project</p>
          <nav className="mt-3 space-y-1 text-sm text-slate-400">
            <Link href="/docs#wonderbuild" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderBuild</Link>
            <Link href="/wonderspace" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">WonderSpace</Link>
            <Link href="/dashboard/3dhub" className="block rounded-lg px-3 py-2 hover:bg-slate-900 hover:text-white">3D</Link>
          </nav>
        </aside>

        <main className="min-w-0 bg-white text-slate-950">
          <article className="mx-auto max-w-4xl px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link href="/docs" className="hover:text-blue-600">Docs</Link>
              <ChevronRight className="h-4 w-4" />
              <span>Getting Started</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-slate-700">Sign Up</span>
            </div>

            <div className="mt-7 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                <UserPlus className="h-4 w-4" /> Step 1
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Create your DreamMakerHub account</h1>
              <p className="mt-4 text-lg leading-8 text-slate-600">Create an account before starting a project so DreamMakerHub can keep your projects and let you return to them later.</p>
            </div>

            <section id="before-you-start" className="scroll-mt-28 pt-12">
              <h2 className="text-2xl font-black">Before you start</h2>
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                  <div>
                    <p className="font-bold text-slate-950">Use an email address you can open.</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">After email/password signup succeeds, DreamMakerHub tells you to check that inbox for a confirmation link.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="create-account" className="scroll-mt-28 pt-14">
              <h2 className="text-3xl font-black tracking-tight">Create your account</h2>
              <p className="mt-3 leading-7 text-slate-600">The current account screen uses the same email and password fields for sign in and sign up.</p>

              <div className="mt-7">
                <AuthPreview />
              </div>

              <div className="mt-8 space-y-6">
                <Step number={1} title="Open the account page">
                  Go to <Link href="/public-pages/auth" className="font-semibold text-blue-700 underline underline-offset-4">DreamMakerHub Sign In</Link>. If you are already signed in, DreamMakerHub may send you directly to your Projects dashboard instead.
                </Step>
                <Step number={2} title="Enter your email">
                  Type the email address you want connected to the account.
                </Step>
                <Step number={3} title="Enter your password">
                  Enter the password you want to use. If the authentication service rejects the password, the account screen displays the returned error underneath the fields.
                </Step>
                <Step number={4} title="Click Sign Up">
                  The <strong>Sign Up</strong> action is underneath the Sign In button beside “No account?”. It uses the email and password already entered in the fields.
                </Step>
              </div>
            </section>

            <section id="confirm-email" className="scroll-mt-28 pt-14">
              <h2 className="text-3xl font-black tracking-tight">Confirm your email</h2>
              <p className="mt-3 leading-7 text-slate-600">When signup is accepted, the account screen displays <strong>“Check your email for the confirmation link.”</strong></p>

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-bold text-emerald-950">After you see that message</p>
                    <ol className="mt-3 space-y-2 text-sm leading-6 text-emerald-950/80">
                      <li>1. Open the inbox for the email you entered.</li>
                      <li>2. Open the DreamMakerHub confirmation email.</li>
                      <li>3. Follow the confirmation link.</li>
                      <li>4. Return to DreamMakerHub and sign in if you are not already signed in.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            <section id="oauth" className="scroll-mt-28 pt-14">
              <h2 className="text-3xl font-black tracking-tight">Use GitHub or Google instead</h2>
              <p className="mt-3 leading-7 text-slate-600">The current account page also provides GitHub and Google buttons. Selecting one sends you to that provider to continue authentication, then returns you to DreamMakerHub.</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <Github className="h-6 w-6" />
                  <h3 className="mt-4 font-bold">GitHub</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose GitHub on the account screen, complete GitHub’s authorization flow, then allow DreamMakerHub to return you to the site.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="grid h-6 w-6 place-items-center rounded-full border border-slate-300 text-xs font-black">G</div>
                  <h3 className="mt-4 font-bold">Google</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Choose Google, select the account you want to use, finish the provider flow, and return to DreamMakerHub.</p>
                </div>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-28 pt-14">
              <div className="flex items-center gap-3">
                <CircleHelp className="h-7 w-7 text-amber-600" />
                <h2 className="text-3xl font-black tracking-tight">If something goes wrong</h2>
              </div>

              <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
                <div className="p-5">
                  <h3 className="font-bold">The page sends me straight to Projects</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">You already have a verified active session. DreamMakerHub checks for an existing signed-in user when the account page loads and redirects authenticated users to their destination.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">“Authentication service is temporarily unavailable”</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Refresh the account page and try again. If the message continues, the authentication configuration or service is unavailable, so repeatedly changing your password will not fix it.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">I do not see the confirmation email</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Check Spam, Junk, Promotions, and the exact inbox you entered. If it still does not arrive, return to the account page and try again or use the Support Center rather than creating several different accounts.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">GitHub or Google returns an error</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Return to the DreamMakerHub account page and retry. The current site reports provider rejection, incomplete OAuth responses, session-exchange failures, and callback failures directly on the account screen.</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">I already have an account</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Do not create another one. Use the Sign In button with the account you already created.</p>
                </div>
              </div>

              <Link href="/support" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold hover:border-blue-400 hover:text-blue-700">
                Open Support Center <ExternalLink className="h-4 w-4" />
              </Link>
            </section>

            <section id="next" className="scroll-mt-28 pt-14">
              <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-8">
                <ShieldCheck className="h-7 w-7 text-blue-400" />
                <h2 className="mt-4 text-2xl font-black">What happens next</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">After the account is confirmed, the next step in the DreamMakerHub workflow is signing in. Once signed in, the normal destination is your Projects dashboard unless you were sent to the account page from another protected part of the site.</p>
                <Link href="/docs#sign-in" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500">
                  Next: Sign In <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-7 text-sm">
              <Link href="/docs" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Docs home</Link>
              <Link href="/docs#sign-in" className="inline-flex items-center gap-2 font-semibold text-blue-700">Sign In <ArrowRight className="h-4 w-4" /></Link>
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
