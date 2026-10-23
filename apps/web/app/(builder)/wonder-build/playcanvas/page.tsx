"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Legacy template-gallery URL. Templates now live beside project assets in WonderPlay. */
function LegacyPlayCanvasGalleryRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const sceneId = params.get("sceneId")?.trim() || params.get("scene")?.trim();
    if (sceneId) {
      // Preserve links to existing saved scenes; those still use their original editor.
      router.replace("/wonder-build/playcanvas/editor/" + encodeURIComponent(sceneId));
    } else {
      const projectId = params.get("projectId")?.trim();
      const destination = new URLSearchParams({ tab: "library", tool: "templates" });
      if (projectId) destination.set("projectId", projectId);
      router.replace("/dashboard/3dhub?" + destination.toString());
    }
  }, [params, router]);
  return <p role="status" className="p-8 text-sm text-slate-400">Opening WonderPlay Templates & Library…</p>;
}

export default function PlayCanvasGalleryPage() {
  return <Suspense fallback={<p className="p-8 text-sm text-slate-400">Opening WonderPlay…</p>}><LegacyPlayCanvasGalleryRedirect /></Suspense>;
}
