import { Suspense } from "react";
import StudioApp from "@/components/studio/StudioApp";

export const metadata = {
  title: "3DHub Studio",
  description: "AI 3D Factory, 360 View, Game Builder, and Movie Maker",
};

export default function ThreeDHubPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-400">Loading WonderPlay…</p>}><StudioApp /></Suspense>;
}
