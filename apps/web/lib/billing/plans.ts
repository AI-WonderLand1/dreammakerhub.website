export type PlanId = "free" | "pro" | "team" | "enterprise";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  displayName: string;
  price: number; // in cents
  priceDisplay: string;
  interval: "month" | "year";
  description: string;
  features: string[];
  stripePriceId?: string; // Set this after creating prices in Stripe dashboard
  highlight?: boolean;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "nomad",
    displayName: "The Nomad",
    price: 0,
    priceDisplay: "$0/forever",
    interval: "month",
    description: "Every adventure begins somewhere. Wander in, no credit card required.",
    features: [
      "1 active project",
      "Wonderbuild UI editor",
      "5K AI tokens/month",
      "100 API calls/month",
      "100 MB storage",
      "Community support",
      "dreammakerhub.website subdomain",
    ],
  },
  pro: {
    id: "pro",
    name: "architect",
    displayName: "The Architect",
    price: 3900, // $39/mo - reflects unique value: IDE + AI + 3D in one
    priceDisplay: "$39/mo",
    interval: "month",
    description: "For builders who are serious about shipping. Full creative power, one subscription.",
    stripePriceId: process.env.STRIPE_PRICE_PRO_ID,
    highlight: true,
    features: [
      "5 active projects",
      "100K AI tokens/month",
      "10K API calls/month",
      "5 GB storage",
      "WonderSpace Cloud IDE (1 seat)",
      "10 runtime hours/month",
      "Custom domain included",
      "Priority email support",
    ],
  },
  team: {
    id: "team",
    name: "guild",
    displayName: "The Guild",
    price: 12900, // $129/mo - for agencies using your full platform
    priceDisplay: "$129/mo",
    interval: "month",
    description: "Built for agencies and studios who ship together. Collaborate, iterate, and deliver, without the chaos.",
    stripePriceId: process.env.STRIPE_PRICE_TEAM_ID,
    features: [
      "10 active projects",
      "500K AI tokens/month",
      "100K API calls/month",
      "50 GB storage",
      "WonderSpace IDE (5 seats)",
      "50 runtime hours/month",
      "Shared asset library",
      "300K Compute Credits/mo",
      "Always-on runners",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "architect_worlds",
    displayName: "The Architect of Worlds",
    price: 0, // Custom pricing
    priceDisplay: "Custom",
    interval: "month",
    description: "You're not building a site. You're building infrastructure. We'll build it with you.",
    features: [
      "Unlimited everything",
      "SSO + SCIM directory sync",
      "On-premise or private cloud deployment",
      "Custom AI agent training (your brand voice, your rules)",
      "Git-sync (GitHub / Bitbucket)",
      "Data isolation & multi-tenancy",
      "Accessibility compliance support (WCAG 2.1)",
      "Dedicated account manager",
      "SLA-backed uptime",
      "Custom Compute Credits package",
    ],
  },
};

// For use in checkout/payment flows
export const PAID_PLANS = Object.values(PLANS).filter((p) => p.price > 0 && p.id !== "enterprise");

// Stripe Price IDs - set these after creating products in Stripe Dashboard
// Instructions: 
// 1. Go to https://dashboard.stripe.com/products
// 2. Create products for each plan with recurring prices
// 3. Copy the Price ID (starts with price_) and add to your .env:
//    STRIPE_PRICE_PRO_ID=price_xxxxx
//    STRIPE_PRICE_TEAM_ID=price_xxxxx
