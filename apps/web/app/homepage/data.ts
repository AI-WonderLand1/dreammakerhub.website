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

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "The Nomad",
    tier: "Free",
    price: "$0",
    period: "/forever",
    desc: "Every adventure begins somewhere. Wander in, no credit card required.",
    bullets: ["5 saved WonderSpace IDEs", "2 IDEs running at once", "150 core-hours/month", "500K AI tokens/month", "5 GB included storage"],
    cta: "Start Wandering, It's Free",
    href: "/public-pages/auth?signup=true&redirectTo=%2Fsubscription",
    highlight: false,
    icon: "🌿",
  },
  {
    id: "pro",
    name: "The Architect",
    tier: "Pro",
    price: "$39",
    period: "/mo",
    desc: "For builders who are serious about shipping. Full creative power, one subscription.",
    bullets: [
      "100 saved WonderSpace IDEs", "4 IDEs running at once", "300 core-hours/month",
      "5M AI tokens/month", "100 GB included storage", "Custom domain included",
    ],
    cta: "Become an Architect",
    href: "/checkout?plan=pro&interval=month",
    highlight: true,
    icon: "⭐",
  },
  {
    id: "team",
    name: "The Guild",
    tier: "Team",
    price: "$129",
    period: "/mo",
    desc: "Built for agencies and studios who ship together. Collaborate, iterate, and deliver, without the chaos.",
    bullets: [
      "Unlimited saved WonderSpace IDEs", "8 IDEs running at once", "1,000 pooled core-hours/month",
      "25M pooled AI tokens/month", "500 GB pooled storage", "Shared asset library",
    ],
    cta: "Build With Your Guild",
    href: "/checkout?plan=team&interval=month",
    highlight: false,
    icon: "🏢",
  },
  {
    id: "enterprise",
    name: "The Architect of Worlds",
    tier: "Enterprise",
    price: "Custom",
    period: "",
    desc: "You're not building a site. You're building infrastructure. We'll build it with you.",
    bullets: [
      "Unlimited saved WonderSpace IDEs", "Custom simultaneous IDE limit",
      "Custom compute, AI, and storage pools", "SSO + SCIM directory sync",
      "On-premise or private cloud deployment", "Custom AI agent training",
      "Git-sync (GitHub / Bitbucket)", "Dedicated account manager",
    ],
    cta: "Talk to Us",
    href: "/contact",
    highlight: false,
    icon: "🌐",
  },
];

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
