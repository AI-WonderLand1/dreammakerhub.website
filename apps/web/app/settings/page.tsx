import Link from "next/link";
import { logger } from '@/lib/logger';

export default function SettingsHome() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">User Settings</h1>
      <p className="text-white/75">Select a category from the sidebar to manage your Wonderland account.</p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/settings/cloud-storage"
          className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Connect Your Cloud Storage
        </Link>

        <Link
          href="/dashboard/settings/coder"
          className="inline-flex items-center rounded-lg border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/15"
        >
          WonderSpace Workspaces
        </Link>
      </div>
    </section>
  );
}
