"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";

export default function SpatialDesignerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/wonder-build/playcanvas");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
      <span className="text-6xl">🌌</span>
      <h1 className="text-2xl font-bold text-white">Spatial Designer</h1>
      <p className="max-w-md text-sm text-white/60">
        Redirecting to WonderPlay 3D Studio...
      </p>
      <Link href="/wonder-build/playcanvas" className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
        Open 3D Studio
      </Link>
    </div>
  );
}
