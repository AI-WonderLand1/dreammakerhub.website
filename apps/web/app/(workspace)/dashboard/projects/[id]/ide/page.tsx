"use client";

import { useParams } from "next/navigation";
import WonderSpaceProjectNavigation from "@/components/dashboard/WonderSpaceProjectNavigation";
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
      <div className="relative z-10 pt-4">
        {/* Project tabs replace the old information banner, directly beneath the main site menu. */}
        <div className="border-x border-white/10">
          <WonderSpaceProjectNavigation projectId={projectId} active="ide" />
        </div>

        <WonderSpaceLaunch projectId={projectId} />
      </div>
    </div>
  );
}
