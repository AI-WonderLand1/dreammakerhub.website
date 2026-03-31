import Link from "next/link";

export default function SettingsHome() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">User Settings</h1>
      <p className="text-white/75">Select a category from the sidebar to manage your Wonderland account.</p>

      <Link
        href="/settings/cloud-storage"
        className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
      >
        Connect Your Cloud Storage
      </Link>
    </section>
  );
}
