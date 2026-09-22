import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'IDE Operations | DreamMakerHub' };

export default async function AdminIDEOperationsPage() {
  const supabase = await createClient();
  // getUser verifies the session with Supabase Auth; a username, user-supplied
  // UUID, or unverified getSession result must never grant admin access.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/auth/login');
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!adminIds.includes(user.id)) notFound();

  const urlConfigured = Boolean(process.env.CODER_API_URL);
  const tokenConfigured = Boolean(process.env.CODER_API_TOKEN);
  const billingGate = process.env.BILLABLE_OPERATIONS_ENABLED === 'true';
  const workspaceGate = process.env.CODER_WORKSPACE_CREATION_ENABLED === 'true';

  return (
    <section className="space-y-6 rounded-xl border border-white/15 bg-white/5 p-6">
      <div>
        <h1 className="text-2xl font-semibold">IDE operations</h1>
        <p className="mt-2 text-sm text-white/75">Private operator status. These checks do not expose credentials or turn on customer workspace creation.</p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-white/15 p-4"><dt className="text-white/70">Coder API address</dt><dd className="mt-1 font-semibold">{urlConfigured ? 'Configured (reachability not verified)' : 'Missing'}</dd></div>
        <div className="rounded-lg border border-white/15 p-4"><dt className="text-white/70">Coder backend token</dt><dd className="mt-1 font-semibold">{tokenConfigured ? 'Present (validity not verified)' : 'Missing'}</dd></div>
        <div className="rounded-lg border border-white/15 p-4"><dt className="text-white/70">Billable operations</dt><dd className="mt-1 font-semibold">{billingGate ? 'Enabled at server level' : 'Paused'}</dd></div>
        <div className="rounded-lg border border-white/15 p-4"><dt className="text-white/70">New Coder workspaces</dt><dd className="mt-1 font-semibold">{workspaceGate ? 'Operator switch on' : 'Paused'}</dd></div>
      </dl>
      <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
        <h2 className="font-semibold">Customer access: not yet enabled</h2>
        <p className="mt-2">Supabase Auth owns user IDs and login sessions. A Supabase user ID does not authenticate someone to Coder. The current backend creates workspaces under a shared Coder owner, so customer creation stays blocked independently of both switches until distinct Coder identities and private IDE URLs are verified.</p>
        <p className="mt-2">The requested one-hour Coder TTL is an inactivity autostop, not a measured per-user time allowance. No cumulative usage meter or hard time cutoff has been verified. Do not advertise time-based access as active yet.</p>
      </div>
      <p className="text-sm text-white/70">Your existing personal Coder IDE is not managed or deleted by this page.</p>
      <Link href="/wonderspace/workspaces" className="inline-block rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10">View my website workspace records</Link>
    </section>
  );
}
