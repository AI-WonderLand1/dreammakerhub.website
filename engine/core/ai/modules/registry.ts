export type PublicAiModule = {
  id: string;
  name: string;
  description: string;
  category: string;
  recommendedFor: string[];
  examplePrompts: string[];
  requiresProject: boolean;
  supportsDryRun: boolean;
  capabilities: string[];
  minPlan: "personal" | "enterprise";
};

export const publicAiModules: PublicAiModule[] = [
  {
    id: "landing-page",
    name: "Landing Page Generator",
    description: "Create a marketing landing page with hero, features, and CTA.",
    category: "web",
    recommendedFor: ["Landing pages", "Marketing sites"],
    examplePrompts: ["Launch page for an AI design tool", "Product landing for a mobile app"],
    requiresProject: false,
    supportsDryRun: true,
    capabilities: ["html", "css", "copywriting"],
    minPlan: "personal",
  },
  {
    id: "docs-page",
    name: "Docs Page",
    description: "Generate a simple documentation layout with sections and navigation.",
    category: "documentation",
    recommendedFor: ["Product docs", "Internal wikis"],
    examplePrompts: ["Quickstart for SDK", "API docs outline"],
    requiresProject: false,
    supportsDryRun: true,
    capabilities: ["html", "markdown"],
    minPlan: "personal",
  },
  {
    id: "app-shell",
    name: "App Shell",
    description: "Bootstrap an application shell with layout and routed sections ready for features.",
    category: "app",
    recommendedFor: ["Dashboards", "Internal tools"],
    examplePrompts: ["Dashboard for analytics", "Tooling shell for ops"],
    requiresProject: true,
    supportsDryRun: true,
    capabilities: ["html", "css"],
    minPlan: "enterprise",
  },
];
