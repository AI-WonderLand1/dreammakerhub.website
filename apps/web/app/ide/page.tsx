"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const CODER_ACCESS_URL = process.env.NEXT_PUBLIC_CODER_ACCESS_URL || "https://coder.dreammakerhub.website";

function IDEContent() {
  const searchParams = useSearchParams();
  const workspace = searchParams?.get("workspace") ?? "default";
  const projectId = searchParams?.get("projectId") ?? "";

  useEffect(() => {
    // Redirect to Coder workspace after a brief delay for UX
    const timer = setTimeout(() => {
      const coderUrl = projectId
        ? `${CODER_ACCESS_URL}/workspace/${workspace}?projectId=${projectId}`
        : `${CODER_ACCESS_URL}/workspace/${workspace}`;
      window.location.href = coderUrl;
    }, 1500);

    return () => clearTimeout(timer);
  }, [workspace, projectId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a0a] p-8 text-center">
      <span className="text-6xl">💻</span>
      <h1 className="text-2xl font-bold text-white">Launching WonderSpace IDE</h1>
      <p className="max-w-md text-sm text-white/60">
        Redirecting to your cloud workspace at{" "}
        <span className="font-mono text-cyan-300">{workspace}</span>
      </p>
      <div className="flex gap-3">
        <a
          href={`${CODER_ACCESS_URL}/workspace/${workspace}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Open Now
        </a>
        <Link
          href="/wonderspace/ide"
          className="rounded-lg border border-white/20 px-6 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          Back
        </Link>
      </div>
    </div>
  );
}

export default function IDEPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-4 text-sm text-white/60">Loading...</p>
        </div>
      </div>
    }>
      <IDEContent />
    </Suspense>
  );
}