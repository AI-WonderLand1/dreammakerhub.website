import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Account Settings | DreamMakerHub',
  description: 'Manage account details and verified operator settings.',
};

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const isAdmin = !error && Boolean(user && adminIds.includes(user.id));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="mt-2 text-white/75">Supabase Auth handles your login, passwords, sessions, and account identity.</p>
      </div>
      {isAdmin && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-5">
          <h2 className="text-lg font-semibold">Administrator</h2>
          <p className="mt-2 text-sm text-white/80">Inspect the Coder connection, workspace safeguards, and customer access status. This page never reveals secrets or enables new pods.</p>
          <Link href="/settings/admin/ide" className="mt-4 inline-block rounded-lg border border-cyan-300/40 px-4 py-2 text-sm font-semibold hover:bg-cyan-300/10">IDE operations</Link>
        </div>
      )}
      <Link href="/wonderspace/workspaces" className="inline-block rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">My cloud workspaces</Link>
    </section>
  );
}
