export type PlanId = "free" | "creator" | "pro" | "studio" | "team" | "enterprise";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  displayName: string;
  price: number;
  yearlyPrice?: number;
  priceDisplay: string;
  yearlyPriceDisplay: string;
  interval: "month" | "year";
  description: string;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  stripePriceYearlyId?: string;
  highlight?: boolean;
  trialDays?: number;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "nomad",
    displayName: "The Nomad",
    price: 0,
    yearlyPrice: 0,
    priceDisplay: "$0/forever",
    yearlyPriceDisplay: "$0/yr",
    interval: "month",
    description: "Start building with the core AI WONDERLAND tools before choosing a paid plan.",
    features: [
      "500K AI credits/month",
      "10 3D credits/month",
      "5 projects",
      "5 GB included storage",
      "WonderBuild, AI Playground and NPC tools",
      "Usage dashboard and alerts",
      "WonderSpace cloud IDE is controlled beta",
    ],
  },
  creator: {
    id: "creator",
    name: "creator",
    displayName: "The Creator",
    price: 1900,
    yearlyPrice: 19000,
    priceDisplay: "$19/mo",
    yearlyPriceDisplay: "$190/yr ($15.83/mo)",
    interval: "month",
    description: "For hobbyists and lighter creators who need more AI and 3D usage without jumping to a professional tier.",
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_CREATOR_ID,
    stripePriceId: process.env.STRIPE_PRICE_CREATOR_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_CREATOR_YEARLY_ID,
    trialDays: 7,
    features: [
      "2M AI credits/month",
      "50 3D credits/month",
      "25 projects",
      "25 GB included storage",
      "AI and 3D credit top-ups",
      "WonderBuild, AI Playground and NPC tools",
      "WonderSpace cloud IDE is controlled beta",
    ],
  },
  pro: {
    id: "pro",
    name: "architect",
    displayName: "The Architect",
    price: 3900,
    yearlyPrice: 39000,
    priceDisplay: "$39/mo",
    yearlyPriceDisplay: "$390/yr ($32.50/mo)",
    interval: "month",
    description: "For serious solo builders who need larger AI, 3D, storage and project allowances.",
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_PRO_ID,
    stripePriceId: process.env.STRIPE_PRICE_PRO_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_PRO_YEARLY_ID,
    highlight: true,
    trialDays: 7,
    features: [
      "5M AI credits/month",
      "150 3D credits/month",
      "100 projects",
      "100 GB included storage",
      "AI and 3D credit top-ups",
      "Higher platform usage limits",
      "WonderSpace cloud IDE is controlled beta",
    ],
  },
  studio: {
    id: "studio",
    name: "studio",
    displayName: "The Studio",
    price: 7900,
    yearlyPrice: 79000,
    priceDisplay: "$79/mo",
    yearlyPriceDisplay: "$790/yr ($65.83/mo)",
    interval: "month",
    description: "For power users and small studios with heavier AI, 3D and project workloads.",
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_STUDIO_ID,
    stripePriceId: process.env.STRIPE_PRICE_STUDIO_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_STUDIO_YEARLY_ID,
    trialDays: 7,
    features: [
      "12M AI credits/month",
      "400 3D credits/month",
      "250 projects",
      "250 GB included storage",
      "Higher AI and 3D throughput limits",
      "AI and 3D credit top-ups",
      "WonderSpace cloud IDE is controlled beta",
    ],
  },
  team: {
    id: "team",
    name: "guild",
    displayName: "The Guild",
    price: 12900,
    yearlyPrice: 129000,
    priceDisplay: "$129/mo",
    yearlyPriceDisplay: "$1,290/yr ($107.50/mo)",
    interval: "month",
    description: "For teams that need pooled AI, 3D, storage and project allowances under one membership.",
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_GUILD_ID,
    stripePriceId: process.env.STRIPE_PRICE_TEAM_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_TEAM_YEARLY_ID,
    trialDays: 7,
    features: [
      "25M pooled AI credits/month",
      "1,000 pooled 3D credits/month",
      "500 GB pooled storage",
      "Large pooled project allowance",
      "Team-oriented usage and billing",
      "AI and 3D credit top-ups",
      "WonderSpace cloud IDE is controlled beta",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "architect_worlds",
    displayName: "The Architect of Worlds",
    price: 0,
    priceDisplay: "Custom",
    yearlyPriceDisplay: "Custom",
    interval: "month",
    description: "Negotiated limits, infrastructure, isolation and support for organizations with custom requirements.",
    features: [
      "Custom AI credit pool",
      "Custom 3D credit pool",
      "Custom storage and project limits",
      "SSO / SCIM where contracted",
      "Private-cloud or on-prem options where contracted",
      "Dedicated support and SLA terms by agreement",
    ],
  },
};

export const PAID_PLANS = Object.values(PLANS).filter((p) => p.price > 0 && p.id !== "enterprise");
