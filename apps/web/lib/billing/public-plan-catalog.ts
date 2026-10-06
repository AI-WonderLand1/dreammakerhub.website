export type PublicPlanId = "free" | "creator" | "pro" | "studio" | "team" | "enterprise";

export type PublicPlanCatalogEntry = {
  id: PublicPlanId;
  slug: string;
  tier: string;
  displayName: string;
  price: number;
  yearlyPrice?: number;
  priceDisplay: string;
  yearlyPriceDisplay: string;
  homepagePrice: string;
  homepagePeriod: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
  icon: string;
};

export const PUBLIC_PLAN_ORDER: PublicPlanId[] = [
  "free",
  "creator",
  "pro",
  "studio",
  "team",
  "enterprise",
];

export const PUBLIC_PLAN_CATALOG: Record<PublicPlanId, PublicPlanCatalogEntry> = {
  free: {
    id: "free",
    slug: "nomad",
    tier: "Free",
    displayName: "The Nomad",
    price: 0,
    yearlyPrice: 0,
    priceDisplay: "$0/forever",
    yearlyPriceDisplay: "$0/yr",
    homepagePrice: "$0",
    homepagePeriod: "/forever",
    description: "The free starter membership for exploring AI WONDERLAND and building lighter projects before upgrading.",
    features: [
      "500K AI credits/month",
      "10 3D credits/month",
      "5 projects",
      "5 GB included storage",
      "WonderBuild, AI Playground and NPC tools",
      "Usage dashboard and alerts",
      "WonderSpace cloud IDE is controlled beta",
    ],
    cta: "Start Free",
    href: "/subscription",
    highlight: false,
    icon: "🌿",
  },
  creator: {
    id: "creator",
    slug: "creator",
    tier: "Creator",
    displayName: "The Creator",
    price: 1900,
    yearlyPrice: 19000,
    priceDisplay: "$19/mo",
    yearlyPriceDisplay: "$190/yr ($15.83/mo)",
    homepagePrice: "$19",
    homepagePeriod: "/mo",
    description: "The individual creator membership for lighter AI, 3D, website and app-building workloads.",
    features: [
      "2M AI credits/month",
      "50 3D credits/month",
      "25 projects",
      "25 GB included storage",
      "AI and 3D credit top-ups",
      "WonderBuild, AI Playground and NPC tools",
      "WonderSpace cloud IDE is controlled beta",
    ],
    cta: "Choose Creator",
    href: "/subscription",
    highlight: false,
    icon: "🎨",
  },
  pro: {
    id: "pro",
    slug: "architect",
    tier: "Architect",
    displayName: "The Architect",
    price: 3900,
    yearlyPrice: 39000,
    priceDisplay: "$39/mo",
    yearlyPriceDisplay: "$390/yr ($32.50/mo)",
    homepagePrice: "$39",
    homepagePeriod: "/mo",
    description: "The serious solo-builder membership for larger AI, 3D, project, storage and deployment workloads.",
    features: [
      "5M AI credits/month",
      "150 3D credits/month",
      "100 projects",
      "100 GB included storage",
      "AI and 3D credit top-ups",
      "Higher platform usage limits",
      "WonderSpace cloud IDE is controlled beta",
    ],
    cta: "Choose Architect",
    href: "/subscription",
    highlight: true,
    icon: "⭐",
  },
  studio: {
    id: "studio",
    slug: "studio",
    tier: "Studio",
    displayName: "The Studio",
    price: 7900,
    yearlyPrice: 79000,
    priceDisplay: "$79/mo",
    yearlyPriceDisplay: "$790/yr ($65.83/mo)",
    homepagePrice: "$79",
    homepagePeriod: "/mo",
    description: "The power-user and small-studio membership for heavier AI, 3D, project and storage workloads.",
    features: [
      "12M AI credits/month",
      "400 3D credits/month",
      "250 projects",
      "250 GB included storage",
      "Higher AI and 3D throughput limits",
      "AI and 3D credit top-ups",
      "WonderSpace cloud IDE is controlled beta",
    ],
    cta: "Choose Studio",
    href: "/subscription",
    highlight: false,
    icon: "🎬",
  },
  team: {
    id: "team",
    slug: "guild",
    tier: "Guild",
    displayName: "The Guild",
    price: 12900,
    yearlyPrice: 129000,
    priceDisplay: "$129/mo",
    yearlyPriceDisplay: "$1,290/yr ($107.50/mo)",
    homepagePrice: "$129",
    homepagePeriod: "/mo",
    description: "The team membership with pooled AI, 3D, storage, project and collaboration allowances.",
    features: [
      "25M pooled AI credits/month",
      "1,000 pooled 3D credits/month",
      "500 GB pooled storage",
      "Large pooled project allowance",
      "Team-oriented usage and billing",
      "AI and 3D credit top-ups",
      "WonderSpace cloud IDE is controlled beta",
    ],
    cta: "Choose Guild",
    href: "/subscription",
    highlight: false,
    icon: "🏢",
  },
  enterprise: {
    id: "enterprise",
    slug: "architect_worlds",
    tier: "Enterprise",
    displayName: "The Architect of Worlds",
    price: 0,
    priceDisplay: "Custom",
    yearlyPriceDisplay: "Custom",
    homepagePrice: "Custom",
    homepagePeriod: "",
    description: "The custom enterprise membership for negotiated infrastructure, isolation, usage, security and support requirements.",
    features: [
      "Custom AI credit pool",
      "Custom 3D credit pool",
      "Custom storage and project limits",
      "SSO / SCIM where contracted",
      "Private-cloud or on-prem options where contracted",
      "Dedicated support and SLA terms by agreement",
    ],
    cta: "Talk to Us",
    href: "/contact",
    highlight: false,
    icon: "🌐",
  },
};

export function getPublicPlanDisplayName(value: unknown): string {
  const id = typeof value === "string" ? value.toLowerCase() : "free";
  return PUBLIC_PLAN_CATALOG[id as PublicPlanId]?.displayName ?? PUBLIC_PLAN_CATALOG.free.displayName;
}
