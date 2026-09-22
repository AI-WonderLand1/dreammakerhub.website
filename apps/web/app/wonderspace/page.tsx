import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceLaunch from '@/components/engines/WonderSpaceLaunch';
import CustomerWorkspaceLaunch from '@/components/engines/CustomerWorkspaceLaunch';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private Coder cloud development workspace.',
};

export default async function WonderSpacePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const isOperator = !error && Boolean(user && adminIds.includes(user.id));
  // Customers get their own form ONLY after the operator opts in. The existing
  // personal workspace and its Coder template never become customer defaults.
  const customerPilot = !isOperator && process.env.CODER_CUSTOMER_PROVISIONING_ENABLED === 'true';

  if (isOperator) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#080d22] px-5 py-12 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(96,76,218,0.4),transparent_42%),radial-gradient(ellipse_at_85%_75%,rgba(18,148,206,0.28),transparent_45%),radial-gradient(ellipse_at_60%_0%,rgba(224,83,197,0.17),transparent_35%)]" />
        <div className="relative mx-auto max-w-3xl">
          <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">← Back to Dashboard</Link>

          <section className="mt-12 rounded-3xl border border-emerald-300/25 bg-[#101931]/90 p-8 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">Operator IDE</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Your existing production workspace</h1>
            <p className="mt-4 text-slate-300">
              DreamMakerHub will open the existing <strong className="text-white">wonderingtribe/production</strong> workspace.
              If it is stopped, the server starts that same Coder workspace and keeps its existing persistent disk.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/wonderspace/my-ide"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-center font-semibold text-slate-950"
              >
                Open / start production IDE
              </Link>
              <Link
                href="/wonderspace/workspaces"
                className="rounded-xl border border-cyan-300/40 bg-slate-950 px-6 py-3 text-center font-semibold text-cyan-100 hover:bg-slate-800"
              >
                Manage cloud workspaces
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              This button does not create another workspace, so it does not use the new-workspace cost gate.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="fixed right-5 top-5 z-50">
        <Link href="/wonderspace/workspaces" className="rounded-xl border border-cyan-300/40 bg-slate-950 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg hover:bg-slate-800">
          Manage cloud workspaces
        </Link>
      </div>
      {customerPilot ? <CustomerWorkspaceLaunch /> : <WonderSpaceLaunch />}
    </>
  );
}
