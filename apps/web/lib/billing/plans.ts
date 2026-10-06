import { PUBLIC_PLAN_CATALOG, type PublicPlanId } from "@/lib/billing/public-plan-catalog";

export type PlanId = PublicPlanId;

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

function publicPlan(id: PlanId): PlanDefinition {
  const plan = PUBLIC_PLAN_CATALOG[id];
  return {
    id: plan.id,
    name: plan.slug,
    displayName: plan.displayName,
    price: plan.price,
    yearlyPrice: plan.yearlyPrice,
    priceDisplay: plan.priceDisplay,
    yearlyPriceDisplay: plan.yearlyPriceDisplay,
    interval: "month",
    description: plan.description,
    features: [...plan.features],
    highlight: plan.highlight,
  };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: publicPlan("free"),
  creator: {
    ...publicPlan("creator"),
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_CREATOR_ID,
    stripePriceId: process.env.STRIPE_PRICE_CREATOR_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_CREATOR_YEARLY_ID,
    trialDays: 7,
  },
  pro: {
    ...publicPlan("pro"),
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_ARCHITECT_ID || process.env.STRIPE_CATALOG_PRODUCT_PRO_ID,
    stripePriceId: process.env.STRIPE_PRICE_ARCHITECT_ID || process.env.STRIPE_PRICE_PRO_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_ARCHITECT_YEARLY_ID || process.env.STRIPE_PRICE_PRO_YEARLY_ID,
    trialDays: 7,
  },
  studio: {
    ...publicPlan("studio"),
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_STUDIO_ID,
    stripePriceId: process.env.STRIPE_PRICE_STUDIO_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_STUDIO_YEARLY_ID,
    trialDays: 7,
  },
  team: {
    ...publicPlan("team"),
    stripeProductId: process.env.STRIPE_CATALOG_PRODUCT_GUILD_ID,
    stripePriceId: process.env.STRIPE_PRICE_GUILD_ID || process.env.STRIPE_PRICE_TEAM_ID,
    stripePriceYearlyId: process.env.STRIPE_PRICE_GUILD_YEARLY_ID || process.env.STRIPE_PRICE_TEAM_YEARLY_ID,
    trialDays: 7,
  },
  enterprise: publicPlan("enterprise"),
};

export const PAID_PLANS = Object.values(PLANS).filter((p) => p.price > 0 && p.id !== "enterprise");
