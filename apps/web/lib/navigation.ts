import type { StaticImport } from "next/image";

/**
 * Central navigation registry for AI Wonderland.
 *
 * Public/global navigation should expose the product hubs, not every internal
 * editor route. Advanced tools stay reachable from inside their product.
 */

export type NavCategory = "builder" | "workspace" | "tools" | "community" | "docs";

export type NavPage = {
  path: string;
  label: string;
  icon: string;
  category: NavCategory;
  description: string;
  external?: boolean;
};

export type PrimaryNavItem = {
  id: "build" | "code" | "3d";
  label: string;
  product: string;
  tagline: string;
  icon: StaticImport | string;
  href: string;
  items: { label: string; href: string; description: string; external?: boolean }[];
};

export type SecondaryNavItem = {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
};

export const PAGES: NavPage[] = [
  { path: "/wonder-build", label: "WonderBuild", icon: "⚡", category: "builder", description: "Start and manage website or web-app projects." },
  { path: "/wonder-build/builder", label: "Website Builder", icon: "🎨", category: "builder", description: "AI-assisted visual editor with code, preview, and publish." },
  { path: "/wonderspace", label: "WonderSpace", icon: "💻", category: "workspace", description: "Private cloud development workspace with files, terminal, Git, and AI coding tools." },
  { path: "https://playground.dreammakerhub.website/", label: "AI Playground", icon: "🤖", category: "workspace", description: "Test prompts, providers, models, and agent workflows.", external: true },
  { path: "/dashboard/3dhub", label: "WonderPlay", icon: "🎮", category: "tools", description: "Start and manage 3D scenes, games, worlds, and assets." },
  { path: "/wonder-play", label: "NPC-AI-SIM", icon: "🧙", category: "tools", description: "Create and test intelligent 3D characters." },
  { path: "/community", label: "Community", icon: "👥", category: "community", description: "Join builders and community discussions." },
  { path: "/docs", label: "Docs", icon: "📖", category: "docs", description: "Read product and API documentation." },
];

export function getPagesByCategory(category: NavCategory): NavPage[] {
  return PAGES.filter((page) => page.category === category);
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    id: "build",
    label: "Build",
    product: "WonderBuild",
    tagline: "Websites & web apps",
    icon: "⚡",
    href: "/wonder-build",
    items: [
      { label: "WonderBuild", href: "/wonder-build", description: "Start from AI, a template, an existing project, or blank." },
      { label: "Website Builder", href: "/wonder-build/builder", description: "Edit with AI, drag-and-drop, code, preview, and publish." },
      { label: "Templates", href: "/wonder-build/templates", description: "Choose a starting design." },
    ],
  },
  {
    id: "code",
    label: "Code",
    product: "WonderSpace",
    tagline: "Files, Git, terminal & AI",
    icon: "💻",
    href: "/wonderspace",
    items: [
      { label: "WonderSpace", href: "/wonderspace", description: "Open your private cloud IDE with files, terminal, Git, and AI coding tools." },
      { label: "AI Playground", href: "https://playground.dreammakerhub.website/", description: "Test models, prompts, and providers.", external: true },
    ],
  },
  {
    id: "3d",
    label: "3D",
    product: "WonderPlay",
    tagline: "Worlds, scenes & NPCs",
    icon: "🎮",
    href: "/dashboard/3dhub",
    items: [
      { label: "WonderPlay", href: "/dashboard/3dhub", description: "Start and manage realtime 3D projects." },
      { label: "NPC-AI-SIM", href: "/wonder-play", description: "Create, configure, test, and export intelligent characters." },
    ],
  },
];

export const SECONDARY_NAV: SecondaryNavItem[] = [
  { label: "Projects", href: "/dashboard/projects", icon: "📁" },
  { label: "Docs", href: "/docs", icon: "📖" },
  { label: "Account", href: "/settings/account", icon: "👤" },
];

/**
 * Maps an internal project `type` to its canonical workspace destination.
 */
const PROJECT_TYPE_TO_DESTINATION: Record<string, string> = {
  wonderbuild: "/wonder-build/builder",
  wonderbuild_ui: "/wonder-build/builder",
  website: "/wonder-build/builder",
  "landing-page": "/wonder-build/builder",
  landing_page: "/wonder-build/builder",
  "web-app": "/wonder-build/builder",
  web_app: "/wonder-build/builder",
  app: "/wonder-build/builder",
  store: "/wonder-build/builder",
  custom: "/wonder-build/builder",
  puck: "/wonder-build/builder",
  workspace: "/wonderspace",
  code: "/wonderspace",
  game: "/dashboard/3dhub",
  "3d": "/dashboard/3dhub",
  "3d_scene": "/dashboard/3dhub",
  playcanvas: "/wonder-build/playcanvas/editor/blank_canvas",
  npc: "/wonder-play",
};

export function resolveProjectDestination(projectType?: string | null): string {
  return PROJECT_TYPE_TO_DESTINATION[projectType ?? ""] ?? "/wonder-build";
}
