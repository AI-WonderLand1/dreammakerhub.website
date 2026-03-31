"use client";

import { usePathname } from "next/navigation";
import Navbar from "@components/Navbar";
import NavOverlay from "@components/NavOverlay";
import AiChat from "@components/AiChat";

// Define navigation structure
const navigationGroups = [
  {
    label: "Platform",
    items: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Playground", href: "/playground" },
      { name: "WonderSpace", href: "/wonderspace" },
      { name: "Wonder Build", href: "/wonder-build" },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Documentation", href: "/docs" },
      { name: "Marketplace", href: "/marketplace" },
      { name: "Projects", href: "/projects" },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/settings" },
      { name: "Subscription", href: "/subscription" },
    ],
  },
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  // Treat any path that contains `/wonderspace` (case-insensitive)
  // or workspace-scoped variants as the IDE route.
  const isIDE = /\/wonderspace/i.test(pathname);

  if (isIDE) {
    // IDE gets NO marketing chrome or global nav overlay
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#0b0b10] text-gray-100">
        {children}
        {/* Optional: keep AiChat available inside IDE */}
        <AiChat />
      </div>
    );
  }

  // Site shell (marketing / normal app pages)
  return (
    <div className="min-h-screen w-full relative bg-black text-gray-100 overflow-x-hidden">
      <SiteBackground />

      <Navbar />
      <NavOverlay nav={navigationGroups} />

      <div className="relative z-10">{children}</div>

      <AiChat />
    </div>
  );
}

function SiteBackground() {
  // One background owner. No duplicate backgrounds underneath.
  return (
    <div
      className="fixed inset-0 -z-10 bg-cover bg-center"
      style={{
        backgroundImage: "url(/your-top-background.jpg)", // put the top background image in /public
      }}
    >
      {/* Optional: dark overlay */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
