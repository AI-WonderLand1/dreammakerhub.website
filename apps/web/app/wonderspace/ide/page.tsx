"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GitHubStyleLayout from "@/app/components/layouts/GitHubStyleLayout";

type Platform = "web" | "ios" | "android" | "multi";

export default function WonderSpaceIdeLaunchPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [owner, setOwner] = useState("");
  const [platform, setPlatform] = useState<Platform>("web");
  const [imageTag, setImageTag] = useState("coder-ide:latest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugPreview = useMemo(() => {
    return (workspaceName || "my-workspace")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }, [workspaceName]);

  const launchWorkspace = async () => {
    if (!workspaceName.trim() || !owner.trim()) {
      setError("Workspace name and owner are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wonderspace/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName,
          workspaceOwner: owner,
          platform,
          integrationMode: "new",
          description: `WonderSpace IDE workspace using image ${imageTag}`,
          files: 0,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to create workspace.");
      }

      const payload = await res.json();
      const projectId = payload?.project?.id;
      const workspaceId = slugPreview || projectId || "default";

      router.push(`/ide?workspace=${encodeURIComponent(workspaceId)}&projectId=${encodeURIComponent(projectId || "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create workspace.");
      setLoading(false);
    }
  };

  return (
    <GitHubStyleLayout>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#10162d] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">WonderSpace IDE</p>
          <h1 className="mt-2 text-3xl font-semibold">Create your cloud workspace</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/70">
            This launch flow mirrors a GitHub Codespaces style onboarding: create a named workspace, select runtime profile,
            and jump straight into WonderSpace IDE.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-white/10 bg-[#10162d] p-6">
            <h2 className="text-lg font-medium">New workspace</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs text-white/60">Workspace name</span>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="customer-portal"
                  className="w-full rounded-lg border border-white/15 bg-[#0c1226] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-white/60">Owner</span>
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="acme-team"
                  className="w-full rounded-lg border border-white/15 bg-[#0c1226] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-white/60">Platform</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full rounded-lg border border-white/15 bg-[#0c1226] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                >
                  <option value="web">Web</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="multi">Multi-platform</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-white/60">IDE image</span>
                <input
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0c1226] px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
              </label>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={launchWorkspace}
                  disabled={loading}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating workspace…" : "Create workspace"}
                </button>
                <Link href="/ide" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                  Open existing IDE
                </Link>
                <Link href="/dashboard" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                  Cancel
                </Link>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-[#10162d] p-6">
            <h3 className="text-sm font-semibold text-cyan-200">Launch preview</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-white/50">Workspace slug</dt>
                <dd className="font-mono text-white">{slugPreview || "my-workspace"}</dd>
              </div>
              <div>
                <dt className="text-white/50">Container image</dt>
                <dd className="font-mono text-white">{imageTag}</dd>
              </div>
              <div>
                <dt className="text-white/50">Destination</dt>
                <dd className="font-mono text-white">/ide?workspace={slugPreview || "my-workspace"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-white/60">
              Minor differences from GitHub Codespaces: this uses your WonderSpace naming, your image tags, and stays within WonderSpace IDE.
            </p>
          </aside>
        </div>
      </section>
    </GitHubStyleLayout>
  );
}
