import { Layout, Code, Terminal, Database } from "lucide-react";

export type BuilderDockLink = {
  label: string;
  href: string;
  icon: typeof Layout;
  description: string;
};

export const BUILDER_LINKS: BuilderDockLink[] = [
  {
    label: "Wonder-Build",
    href: "/wonder-build",
    icon: Layout,
    description: "Visual 3D Canvas Editor",
  },
  {
    label: "Cloud IDE",
    href: "/ide",
    icon: Code,
    description: "Full cloud-based development environment (code-server)",
  },
  {
    label: "Playground",
    href: "/playground",
    icon: Terminal,
    description: "Isolated API and Logic Testing",
  },
  {
    label: "Data Vault",
    href: "/settings/cloud-storage",
    icon: Database,
    description: "Manage BYOC storage connections",
  },
];

export const BUILDER_DOCK_FOOTER_LINKS = {
  leavePageFallbackHref: "/",
  dashboardHref: "/dashboard",
} as const;

// Backward-compatible alias for any existing lowercase imports.
export const builderLinks = BUILDER_LINKS;
