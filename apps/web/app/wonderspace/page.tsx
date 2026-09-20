import Link from 'next/link';
import WonderSpaceLaunch from '@/components/engines/WonderSpaceLaunch';

export const metadata = {
  title: 'WonderSpace | AI Wonderland',
  description: 'Launch your private Coder cloud development workspace.',
};

export default function WonderSpacePage() {
  return (
    <>
      <div className="fixed right-5 top-5 z-50">
        <Link href="/wonderspace/workspaces" className="rounded-xl border border-cyan-300/40 bg-slate-950 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg hover:bg-slate-800">
          Manage cloud workspaces
        </Link>
      </div>
      <WonderSpaceLaunch />
    </>
  );
}
