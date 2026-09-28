import type Stripe from "stripe";
import type { PlanDefinition } from "./plans";

export type BillingInterval = "month" | "year";

/** Only Stripe's server-returned Price data can establish a payable plan. */
export function stripePriceMatchesPlan(
  price: Stripe.Price,
  plan: PlanDefinition,
  interval: BillingInterval,
): boolean {
  const expectedAmount = interval === "year" ? plan.yearlyPrice : plan.price;
  const expectedPriceId = interval === "year" ? plan.stripePriceYearlyId : plan.stripePriceId;
  const actualProductId = typeof price.product === "string" ? price.product : price.product?.id;

  // A known product takes precedence over a possibly stale manually configured Price.
  // If no product was configured, only the exact explicit Price ID is accepted.
  const matchesIdentity = plan.stripeProductId
    ? actualProductId === plan.stripeProductId
    : Boolean(expectedPriceId && price.id === expectedPriceId);

  return matchesIdentity &&
    expectedAmount !== undefined &&
    price.currency === "usd" &&
    price.type === "recurring" &&
    price.unit_amount === expectedAmount &&
    price.recurring?.interval === interval &&
    // Stripe uses the same interval for e.g. monthly and every 3 months.
    // Never grant a monthly/yearly plan for a multi-interval recurring Price.
    price.recurring?.interval_count === 1 &&
    price.recurring?.usage_type === "licensed";
}

/**
 * Ambiguous duplicate Prices fail closed unless one is the product's
 * explicitly configured default. Never choose based on array order or age.
 */
export function selectCatalogCheckoutPriceId(
  prices: Stripe.Price[],
  plan: PlanDefinition,
  interval: BillingInterval,
  defaultPriceId: string | null = null,
): string | null {
  const matches = prices.filter((price) =>
    price.active && stripePriceMatchesPlan(price, plan, interval));
  if (matches.length === 1) return matches[0].id;
  if (matches.length > 1 && defaultPriceId) {
    return matches.find((price) => price.id === defaultPriceId)?.id || null;
  }
  return null;
}
