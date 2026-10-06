export type NavMenuItem = {
  title: string;
  items: { name: string; href: string; icon: string }[];
};

export const menuItems: NavMenuItem[] = [
  {
    title: "Build",
    items: [
      { name: "WonderBuild", href: "/wonder-build", icon: "⚡" },
    ],
  },
  {
    title: "Code",
    items: [
      { name: "WonderSpace", href: "/wonderspace", icon: "💻" },
      { name: "AI Playground", href: "https://playground.dreammakerhub.website/", icon: "🤖" },
    ],
  },
  {
    title: "3D",
    items: [
      { name: "WonderPlay 3D Studio", href: "/dashboard/3dhub", icon: "🎮" },
      { name: "NPC-AI-SIM", href: "/wonder-play", icon: "🧙" },
    ],
  },
  {
    title: "Explore",
    items: [
      { name: "My Projects", href: "/dashboard/projects", icon: "📁" },
      { name: "Marketplace", href: "/marketplace", icon: "🛍️" },
    ],
  },
  {
    title: "Resources",
    items: [
      { name: "Documentation", href: "/docs", icon: "📚" },
      { name: "Tutorials", href: "/tutorials", icon: "🎓" },
      { name: "Community", href: "/community", icon: "👥" },
      { name: "About", href: "/about", icon: "ℹ️" },
      { name: "Contact", href: "/contact", icon: "📧" },
    ],
  },
];

export type Plan = {
  id: string;
  name: string;
  tier: string;
  price: string;
  period: string;
  desc: string;
  bullets: string[];
  cta: string;
  href: string;
  highlight: boolean;
  icon: string;
};

import { PUBLIC_PLAN_CATALOG, PUBLIC_PLAN_ORDER } from "@/lib/billing/public-plan-catalog";

export const PLANS: Plan[] = PUBLIC_PLAN_ORDER.map((id) => {
  const plan = PUBLIC_PLAN_CATALOG[id];
  return {
    id: plan.id,
    name: plan.displayName,
    tier: plan.tier,
    price: plan.homepagePrice,
    period: plan.homepagePeriod,
    desc: plan.description,
    bullets: [...plan.features],
    cta: plan.cta,
    href: plan.href,
    highlight: plan.highlight,
    icon: plan.icon,
  };
});

export type RegistryItem = {
  icon: string;
  name: string;
  desc: string;
  tag: string;
};

export const REGISTRY_ITEMS: RegistryItem[] = [
  { icon: "📝", name: "Changelog Writer", desc: "Auto-generate changelogs from commits", tag: "Productivity" },
  { icon: "🛡", name: "Schema Guard", desc: "Validate and enforce DB schemas", tag: "Database" },
  { icon: "🎨", name: "Design Tokens", desc: "Sync Figma tokens to your codebase", tag: "Design" },
  { icon: "🤖", name: "AI Reviewer", desc: "Constitutional AI code review agent", tag: "AI" },
  { icon: "🚀", name: "Deploy Runner", desc: "One-click cloud deploy pipeline", tag: "DevOps" },
  { icon: "🔍", name: "Semantic Search", desc: "Vector search over codebase", tag: "AI" },
];
