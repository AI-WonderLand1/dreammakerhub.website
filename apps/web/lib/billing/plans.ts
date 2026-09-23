import { logger } from '@/lib/logger';
export type PlanId = "free" | "pro" | "team" | "enterprise";

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
    priceDisplay: "$0/forever",
    yearlyPriceDisplay: "$0/yr ($0/mo)",
    interval: "month",
    description: "A real cloud-development starting tier: save projects freely, spend compute only while an IDE is running.",
    features: [
      "5 saved WonderSpace IDEs",
      "Up to 2 IDEs running at once",
      "150 core-hours/month included",
      "500K AI tokens/month",
      "5 GB included storage",
      "Wonderbuild UI editor",
      "Community support",
      "dreammakerhub.website subdomain",
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
    description: "For builders who want long-lived saved environments, larger AI usage, and more simultaneous compute.",
    stripePriceId: process.env.STRIPE_PRICE_PRO_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_PRO_YEARLY_ID,
    highlight: true,
    trialDays: 7,
    features: [
      "100 saved WonderSpace IDEs",
      "Up to 4 IDEs running at once",
      "300 core-hours/month included",
      "5M AI tokens/month",
      "100 GB included storage",
      "Custom domain included",
      "Priority email support",
      "Larger machine profiles when available",
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
    description: "A pooled workspace and AI budget for teams that need many saved environments without keeping every machine running.",
    stripePriceId: process.env.STRIPE_PRICE_TEAM_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_TEAM_YEARLY_ID,
    trialDays: 7,
    features: [
      "Unlimited saved WonderSpace IDEs",
      "Up to 8 IDEs running at once",
      "1,000 pooled core-hours/month",
      "25M pooled AI tokens/month",
      "500 GB pooled storage",
      "Shared asset library",
      "Team collaboration",
      "Larger machine profiles when available",
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
    description: "Custom compute, storage, AI, isolation, and support for organizations with negotiated requirements.",
    features: [
      "Unlimited saved WonderSpace IDEs",
      "Custom simultaneous IDE limit",
      "Custom compute, AI, and storage pools",
      "SSO + SCIM directory sync",
      "On-premise or private cloud deployment",
      "Custom AI agent training",
      "Git-sync (GitHub / Bitbucket)",
      "Data isolation & multi-tenancy",
      "Dedicated account manager",
      "SLA-backed uptime",
    ],
  },
};

export const PAID_PLANS = Object.values(PLANS).filter((p) => p.price > 0 && p.id !== "enterprise");
