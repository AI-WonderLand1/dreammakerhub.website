"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { CoderIntegration } from "@/lib/coder/integration";

const SPATIAL_TEMPLATE_ID = process.env.CODER_SPATIAL_TEMPLATE_ID || 'wonderspace-spatial';

export default function SpatialDesignerPage() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideUrl, setIdeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const provisionSpatialWorkspace = async () => {
      setLoading(true);
      setError(null);

      try {
        const coder = new CoderIntegration();

        const { ideUrl } = await coder.provisionIDEForProject(
          user.id,
          SPATIAL_TEMPLATE_ID,
          undefined,
          SPATIAL_TEMPLATE_ID
        );

        setIdeUrl(ideUrl);
        window.location.href = ideUrl;
      } catch (err) {
        console.error('Failed to provision Spatial workspace:', err);
        setError(err instanceof Error ? err.message : 'Failed to create Spatial workspace');
      } finally {
        setLoading(false);
      }
    };

    provisionSpatialWorkspace();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
        <span className="text-6xl">🌌</span>
        <h1 className="text-2xl font-bold text-white">Spatial Designer</h1>
        <p className="max-w-md text-sm text-white/60">
          Authentication required to launch your private Spatial workspace.
        </p>
        <Link
          href="/public-pages/auth"
          className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
      <span className="text-6xl">🌌</span>
      <h1 className="text-2xl font-bold text-white">Launching Spatial Designer</h1>
      <p className="max-w-md text-sm text-white/60">
        Provisioning your private Spatial workspace in a Docker pod...
      </p>
      {loading && (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <span className="text-xs text-white/40">This may take a minute...</span>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {ideUrl && (
        <a
          href={ideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/20 px-6 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          Open Now
        </a>
      )}
    </div>
  );
}
