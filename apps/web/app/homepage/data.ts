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
    id: "free", name: "The Nomad", tier: "Free", price: "$0", period: "/forever",
    desc: "Start with the core AI WONDERLAND tools before choosing a paid plan.",
    bullets: ["500K AI credits/month", "10 3D credits/month", "5 projects", "5 GB storage", "AI Playground + WonderBuild + NPC tools", "WonderSpace: controlled beta"],
    cta: "Start Free", href: "/subscription", highlight: false, icon: "🌿",
  },
  {
    id: "creator", name: "The Creator", tier: "Creator", price: "$19", period: "/mo",
    desc: "For lighter creators who need more AI and 3D usage.",
    bullets: ["2M AI credits/month", "50 3D credits/month", "25 projects", "25 GB storage", "Usage top-ups available", "WonderSpace: controlled beta"],
    cta: "Choose Creator", href: "/subscription", highlight: false, icon: "🎨",
  },
  {
    id: "pro", name: "The Architect", tier: "Architect", price: "$39", period: "/mo",
    desc: "For serious solo builders with larger AI, 3D and storage needs.",
    bullets: ["5M AI credits/month", "150 3D credits/month", "100 projects", "100 GB storage", "Higher platform limits", "WonderSpace: controlled beta"],
    cta: "Choose Architect", href: "/subscription", highlight: true, icon: "⭐",
  },
  {
    id: "studio", name: "The Studio", tier: "Studio", price: "$79", period: "/mo",
    desc: "For power users and small studios with heavier AI and 3D workloads.",
    bullets: ["12M AI credits/month", "400 3D credits/month", "250 projects", "250 GB storage", "Higher throughput limits", "WonderSpace: controlled beta"],
    cta: "Choose Studio", href: "/subscription", highlight: false, icon: "🎬",
  },
  {
    id: "team", name: "The Guild", tier: "Guild", price: "$129", period: "/mo",
    desc: "For teams that need pooled AI, 3D and storage allowances.",
    bullets: ["25M pooled AI credits/month", "1,000 pooled 3D credits/month", "500 GB pooled storage", "Large pooled project allowance", "Team-oriented usage", "WonderSpace: controlled beta"],
    cta: "Choose Guild", href: "/subscription", highlight: false, icon: "🏢",
  },
  {
    id: "enterprise", name: "The Architect of Worlds", tier: "Enterprise", price: "Custom", period: "",
    desc: "Negotiated usage, infrastructure, isolation and support.",
    bullets: ["Custom AI credits", "Custom 3D credits", "Custom storage/projects", "Private infrastructure options", "SSO/SCIM where contracted", "SLA/support by agreement"],
    cta: "Talk to Us", href: "/contact", highlight: false, icon: "🌐",
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
