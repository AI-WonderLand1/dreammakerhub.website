import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/server';
import WonderSpaceLaunch from '@/components/engines/WonderSpaceLaunch';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private Coder cloud development workspace.',
};

export default async function WonderSpacePage() {
  // This link is exclusively for the existing operator workspace. Customers
  // must never be directed to the shared Coder owner or its private IDE.
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const isOperator = !error && Boolean(user && adminIds.includes(user.id));

  return (
    <>
      <div className="fixed right-5 top-5 z-50 flex flex-wrap gap-2">
        {isOperator ? (
          <Link
            href="/wonderspace/my-ide"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-emerald-300/50 bg-slate-950 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg hover:bg-slate-800"
          >
            Open my existing IDE
          </Link>
        ) : null}
        <Link href="/wonderspace/workspaces" className="rounded-xl border border-cyan-300/40 bg-slate-950 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg hover:bg-slate-800">
          Manage cloud workspaces
        </Link>
      </div>
      <WonderSpaceLaunch />
    </>
  );
}
