import type { StaticImport } from "next/image";

/**
 * Central navigation registry for AI Wonderland (DreamMakerHub, Inc.).
 *
 * Consumers should import the consolidated destinations (PRIMARY_NAV /
 * SECONDARY_NAV) instead of hardcoding link arrays in each component.
 * PAGES / getPagesByCategory are kept for the legacy GlobalNavigation /
 * QuadEngineShell surfaces.
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
  // BUILD — WonderBuild website builder
  { path: "/wonder-build", label: "WonderBuild Start", icon: "⚡", category: "builder", description: "Start a website from blank, a template, or AI." },
  { path: "/wonder-build/templates", label: "Website Templates", icon: "📄", category: "builder", description: "Choose or generate a starting point, then open it in the WonderBuild editor." },
  { path: "/wonder-build/builder", label: "WonderBuild Builder", icon: "🎨", category: "builder", description: "AI-assisted drag-and-drop website editor with design, code, preview, and publish." },
  { path: "/wonder-build/agent", label: "Builder Agent", icon: "🤖", category: "builder", description: "Advanced agent-driven build surface. AI editing is also available inside the main builder." },
  // CODE — WonderSpace
  { path: "/wonderspace", label: "WonderSpace", icon: "💻", category: "workspace", description: "AI-powered development environment with agents and preview." },
  { path: "/ide", label: "Cloud IDE", icon: "🖥️", category: "workspace", description: "Your private cloud workspace — VS Code, terminal, git." },
  { path: "/wonderspace/ide", label: "New Workspace", icon: "🚀", category: "workspace", description: "Launch a named cloud IDE workspace." },
  { path: "https://playground.dreammakerhub.website/", label: "AI Playground", icon: "🤖", category: "workspace", description: "Chat with models, test prompts, and run agent workflows.", external: true },
  // 3D — WonderPlay (intentionally unchanged by WonderBuild website-flow work)
  { path: "/dashboard/3dhub", label: "NPC AI SIM", icon: "🎮", category: "tools", description: "Create 3D scenes, 360 views, games and movies — then open them in the PlayCanvas editor." },
  { path: "/wonder-play", label: "WonderPlay App", icon: "🌐", category: "tools", description: "Launch the external NPC AI SIM runtime.", external: true },
  // Community & docs
  { path: "/community", label: "Community", icon: "👥", category: "community", description: "Join builders and office hours." },
  { path: "/docs", label: "Docs", icon: "📖", category: "docs", description: "Read API and architecture docs." },
  { path: "/tutorials", label: "Tutorials", icon: "🎓", category: "docs", description: "Guided walkthroughs." },
];

export function getPagesByCategory(category: NavCategory): NavPage[] {
  return PAGES.filter((p) => p.category === category);
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    id: "build",
    label: "Build",
    product: "WonderBuild",
    tagline: "Start → Build + Preview → Publish",
    icon: "⚡",
    href: "/wonder-build",
    items: [
      { label: "Start Website", href: "/wonder-build", description: "Start blank, choose a template, or generate with AI." },
      { label: "Templates", href: "/wonder-build/templates", description: "Choose or generate a starting design." },
      { label: "Website Builder", href: "/wonder-build/builder", description: "AI + drag-and-drop editor with Preview and Publish." },
    ],
  },
  {
    id: "code",
    label: "Code",
    product: "WonderSpace",
    tagline: "IDE, repos & AI coding",
    icon: "💻",
    href: "/wonderspace",
    items: [
      { label: "WonderSpace", href: "/wonderspace", description: "AI-powered build hub with agents." },
      { label: "Cloud IDE", href: "/ide", description: "VS Code, terminal & git in the cloud." },
      { label: "New Workspace", href: "/wonderspace/ide", description: "Launch a named cloud workspace." },
      { label: "Playground", href: "https://playground.dreammakerhub.website/", description: "Chat with models and run agent workflows.", external: true },
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
      { label: "NPC AI SIM", href: "/dashboard/3dhub", description: "Create 3D scenes, 360 views, games and movies by prompt." },
      { label: "PlayCanvas Editor", href: "/wonder-build/playcanvas", description: "Open the PlayCanvas scene editor for games and movies." },
      { label: "WonderPlay App", href: "/wonder-play", description: "Launch the external WonderPlay runtime.", external: true },
    ],
  },
];

export const SECONDARY_NAV: SecondaryNavItem[] = [
  { label: "Projects", href: "/dashboard/projects", icon: "📁" },
  { label: "Templates", href: "/wonder-build/templates", icon: "📄" },
  { label: "Marketplace", href: "/marketplace", icon: "🛍️" },
  { label: "Playground", href: "https://playground.dreammakerhub.website/", icon: "🤖", external: true },
  { label: "Docs", href: "/docs", icon: "📖" },
  { label: "Account", href: "/settings/account", icon: "👤" },
];

/**
 * Maps an internal project `type` to its canonical workspace destination.
 * The visual builder is a single engine (WonderBuild); the project type only
 * configures which surface opens it.
 */
const PROJECT_TYPE_TO_DESTINATION: Record<string, string> = {
  wonderbuild: "/wonder-build/builder",
  wonderbuild_ui: "/wonder-build/builder",
  website: "/wonder-build/builder",
  "landing-page": "/wonder-build/builder",
  "landing_page": "/wonder-build/builder",
  "web-app": "/wonder-build/builder",
  web_app: "/wonder-build/builder",
  app: "/wonder-build/builder",
  store: "/wonder-build/builder",
  custom: "/wonder-build/builder",
  workspace: "/ide",
  code: "/ide",
  game: "/dashboard/3dhub",
  "3d": "/dashboard/3dhub",
  "3d_scene": "/dashboard/3dhub",
  playcanvas: "/wonder-build/playcanvas/editor/blank_canvas",
  puck: "/wonder-build/builder",
};

export function resolveProjectDestination(projectType?: string | null): string {
  return PROJECT_TYPE_TO_DESTINATION[projectType ?? ""] ?? "/wonder-build";
}
