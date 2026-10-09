"use client";

import { useParams } from "next/navigation";
import WonderSpaceLaunch from "@/components/engines/WonderSpaceLaunch";

export default function ProjectIdePage() {
  const params = useParams();
  const projectId = String(params.id || "");

  return (
    <div
      className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-[#07101b] bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(4, 8, 20, 0.72), rgba(4, 10, 24, 0.82)), url('/images/wonderspace-galaxy.webp')",
      }}
    >
      <div className="relative z-10">
      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-50">
        WonderSpace is an optional editor inside Edit / Design. Choose a blank workspace or a repository below, then open code-server when the workspace is ready.
      </div>

      <WonderSpaceLaunch projectId={projectId} />
      </div>
    </div>
  );
}
