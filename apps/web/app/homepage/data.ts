export type NavMenuItem = {
  title: string;
  items: { name: string; href: string; icon: string }[];
};

export const menuItems: NavMenuItem[] = [
  {
    title: "Build",
    items: [
      { name: "WonderBuild", href: "/wonder-build", icon: "⚡" },
      { name: "AI Studio", href: "/wonder-build/studio", icon: "🧠" },
      { name: "Visual Builder", href: "/wonder-build/builder", icon: "🎨" },
      { name: "Templates", href: "/wonder-build/templates", icon: "📄" },
    ],
  },
  {
    title: "Code",
    items: [
      { name: "WonderSpace", href: "/wonderspace", icon: "💻" },
      { name: "Cloud IDE", href: "/ide", icon: "🖥️" },
      { name: "AI Playground", href: "https://playground.dreammakerhub.website/", icon: "🤖" },
    ],
  },
  {
    title: "3D",
    items: [
      { name: "WonderPlay", href: "/wonder-build/playcanvas", icon: "🎮" },
      { name: "3DHub Studio", href: "/dashboard/3dhub", icon: "🧊" },
      { name: "WebGL Studio", href: "/wonder-build/webgl", icon: "✨" },
      { name: "WonderPlay App", href: "/wonder-play", icon: "🌐" },
    ],
  },
  {
    title: "Explore",
    items: [
      { name: "Projects", href: "/dashboard/projects", icon: "📁" },
      { name: "Marketplace", href: "/marketplace", icon: "🛍️" },
      { name: "NPC Creation", href: "/wonder-build/playcanvas", icon: "🧙‍♂️" },
      { name: "Tutorials", href: "/tutorials", icon: "🎓" },
    ],
  },
  {
    title: "Resources",
    items: [
      { name: "Documentation", href: "/docs", icon: "📚" },
      { name: "API Reference", href: "/api-reference", icon: "📖" },
      { name: "Blog", href: "/blog", icon: "📝" },
      { name: "Community", href: "/community", icon: "👥" },
    ],
  },
  {
    title: "Company",
    items: [
      { name: "About Us", href: "/about", icon: "ℹ️" },
      { name: "Careers", href: "/careers", icon: "💼" },
      { name: "Contact", href: "/contact", icon: "📧" },
      { name: "Privacy Policy", href: "/privacy", icon: "🔒" },
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
    bullets: ["1 active project", "WonderBuild", "5 AI chats per day", "Community support", "dreammakerhub.website subdomain"],
    cta: "Start Wandering, It's Free",
    href: "/public-pages/auth",
    highlight: false,
    icon: "🌿",
  },
  {
    id: "pro",
    name: "The Architect",
    tier: "Pro",
    price: "$35",
    period: "/mo",
    desc: "For builders who are serious about shipping. Full creative power, one subscription.",
    bullets: [
      "5 active projects", "Unlimited AI chats", "WonderPlay 3D Engine (WebGL + glTF)",
      "WonderSpace Cloud IDE", "Egyptian Voice Module", "1-click deployment",
      "Custom domain included", "Accessibility tools for all creators", "Priority email support",
    ],
    cta: "Become an Architect",
    href: "/subscription",
    highlight: true,
    icon: "⭐",
  },
  {
    id: "team",
    name: "The Guild",
    tier: "Team",
    price: "$149",
    period: "/mo",
    desc: "Built for agencies and studios who ship together. Collaborate, iterate, and deliver, without the chaos.",
    bullets: [
      "Everything in Pro", "Up to 5 team seats", "Shared asset library", "3 AI agent seats",
      "Collaborative IDE workspace", "Always-on runners (no hibernation)",
      "White-label ready", "300K Compute Credits/mo included",
    ],
    cta: "Build With Your Guild",
    href: "/subscription",
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
      "Unlimited everything", "SSO + SCIM directory sync",
      "On-premise or private cloud deployment", "Custom AI agent training (your brand voice, your rules)",
      "Git-sync (GitHub / Bitbucket)", "Data isolation & multi-tenancy",
      "Accessibility compliance support (WCAG 2.1)", "Dedicated account manager",
      "SLA-backed uptime", "Custom Compute Credits package",
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
  { icon: "🔍", name: "Semantic Search", desc: "Vector search over your codebase", tag: "AI" },
];
